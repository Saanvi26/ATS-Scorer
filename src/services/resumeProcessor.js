import { extractTextFromPDF } from "./pdfService.js";
import { ApiKeyError } from "../utils/apiKeyUtils.js";
import { analyzeResumeAgainstJob } from "./openai.js";
import { createRateLimiter } from "../utils/apiHelpers.js";
import { createRetryOperation } from "../utils/apiHelpers.js";
import { handleApiError } from "../utils/apiHelpers.js";
import { isPDF } from "../utils/fileValidation.js";
import { isValidFileSize } from "../utils/fileValidation.js";
import { MAX_FILE_SIZE } from "../utils/fileValidation.js";

const getApiKey = () => {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new ApiKeyError(
      "API key not found. Please provide your OpenAI API key.",
      "MISSING_KEY"
    );
  }
  return apiKey;
};

// Configure rate limiter for resume processing
const limiter = createRateLimiter({
  maxConcurrent: 2,
  minTime: 1000,
});

// Format the final response
const formatProcessingResponse = (analysis) => {
  if (!analysis || typeof analysis !== "object") {
    throw new Error("Invalid analysis object: Analysis must be a valid object");
  }

  return {
    score: analysis.score || 0,
    feedback: analysis.feedback || [],
    matchPercentage: analysis.matchPercentage || 0,
    keywordMatches: analysis.keywordMatches || [],
    missingKeywords: analysis.missingKeywords || [],
    suggestions: analysis.suggestions || [],
    detailedAnalysis: analysis.detailedAnalysis || "",
  };
};

// Main resume processing function
const processResumeInternal = async (
  resumeFilePath,
  jobDescription,
  options = {}
) => {
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        // Get and validate API key
        const apiKey = getApiKey();
        // Validate file
        const isValidPDF = await isPDF(resumeFilePath);
        if (!isValidPDF) {
          throw new Error("Invalid PDF file format");
        }

        const isValidSize = await isValidFileSize(
          resumeFilePath,
          MAX_FILE_SIZE
        );
        if (!isValidSize) {
          throw new Error("File size exceeds maximum limit");
        }

        // Process with rate limiting
        const result = await limiter.schedule(async () => {
          // Extract text from PDF
          const resumeText = await extractTextFromPDF(resumeFilePath, {
            onProgress: options.onProgress,
          });

          // console.log('Extracted text:', resumeText);

          // Analyze resume against job description with API key
          const analysis = await analyzeResumeAgainstJob(
            resumeText,
            jobDescription,
            apiKey
          );

          // Validate analysis object before formatting
          if (!analysis || typeof analysis !== "object") {
            throw new Error("Invalid analysis response from OpenAI service");
          }

          return formatProcessingResponse(analysis);
        });

        resolve(result);
      } catch (error) {
        // Log error for debugging
        console.error("Resume processing error:", error);

        // Handle specific error types
        if (error instanceof ApiKeyError) {
          reject(error);
          return;
        }

        // Handle transformation errors
        if (
          error.message.includes("Invalid analysis") ||
          error.message.includes("Failed to transform")
        ) {
          reject(new Error(`Resume analysis failed: ${error.message}`));
          return;
        }

        // Retry on retryable errors
        if (operation.retry(error)) {
          return;
        }

        // Handle other errors
        handleApiError(error);
        reject(error);
      }
    });
  });
};

// Batch process multiple resumes
const batchProcessResumes = async (
  resumeFiles,
  jobDescription,
  options = {}
) => {
  const results = [];
  const errors = [];

  for (const [index, filePath] of resumeFiles.entries()) {
    try {
      const result = await processResumeInternal(filePath, jobDescription, {
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress({
              fileIndex: index,
              totalFiles: resumeFiles.length,
              fileProgress: progress,
              percentComplete: Math.round(
                ((index + progress.percentComplete / 100) /
                  resumeFiles.length) *
                  100
              ),
            });
          }
        },
      });
      results.push({ filePath, result, success: true });
    } catch (error) {
      errors.push({ filePath, error: error.message });
      results.push({ filePath, success: false, error: error.message });
    }
  }

  return {
    results,
    errors: errors.length > 0 ? errors : null,
    success: errors.length === 0,
  };
};

/**
 * Process a single resume against a job description
 * @param {string} resumeFilePath - Path to the resume file
 * @param {string} jobDescription - Job description to match against
 * @param {Object} [options] - Processing options
 * @returns {Promise<Object>} Processing results
 */
export const processResume = processResumeInternal;

/**
 * Process multiple resumes against a job description
 * @param {string[]} resumeFiles - Array of resume file paths
 * @param {string} jobDescription - Job description to match against
 * @param {Object} [options] - Processing options
 * @returns {Promise<Object>} Batch processing results
 */
export { batchProcessResumes };
