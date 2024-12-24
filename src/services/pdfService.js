import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
  createRateLimiter,
  createRetryOperation,
  handleApiError,
  makeApiRequest
} from '../utils/apiHelpers.js';
import {
  isPDF,
  isValidFileSize,
  readFileBuffer,
  MAX_FILE_SIZE
} from '../utils/fileValidation.js';

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;

// Configure rate limiter for PDF processing
const limiter = createRateLimiter({
  maxConcurrent: 3,
  minTime: 500
});

// Extract text from a single page
const extractPageText = async (page) => {
  const textContent = await page.getTextContent();
  return textContent.items
    .map(item => item.str)
    .join(' ');
};

// Process PDF with progress tracking
const processPDFWithProgress = async (pdfData, progressCallback) => {
  const loadingTask = getDocument({ data: pdfData });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  let extractedText = '';

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const pageText = await extractPageText(page);
    extractedText += pageText + '\n';

    if (progressCallback) {
      progressCallback({
        currentPage: pageNum,
        totalPages,
        percentComplete: Math.round((pageNum / totalPages) * 100)
      });
    }
  }

  return extractedText.trim();
};

// Main PDF extraction function
const extractTextFromPDF = async (file, options = {}) => {
  const operation = createRetryOperation();

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        // Validate file
        const isValidPDF = await isPDF(file);
        if (!isValidPDF) {
          throw new Error('Invalid PDF file format');
        }

        const isValidSize = await isValidFileSize(file, MAX_FILE_SIZE);
        if (!isValidSize) {
          throw new Error('File size exceeds maximum limit');
        }

        // Read file
        const fileBuffer = await readFileBuffer(file);

        // Process PDF with rate limiting
        const result = await limiter.schedule(async () => {
          return processPDFWithProgress(fileBuffer, options.onProgress);
        });

        resolve(result);
      } catch (error) {
        if (operation.retry(error)) {
          return;
        }
        handleApiError(error);
        reject(error);
      }
    });
  });
};

// Batch process multiple PDFs
const batchProcessPDFs = async (files, options = {}) => {
  const results = [];
  const errors = [];

  for (const [index, file] of files.entries()) {
    try {
      const text = await extractTextFromPDF(file, {
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress({
              fileIndex: index,
              totalFiles: files.length,
              fileProgress: progress,
              percentComplete: Math.round(((index + (progress.percentComplete / 100)) / files.length) * 100)
            });
          }
        }
      });
      results.push({ fileName: file.name, text, success: true });
    } catch (error) {
      errors.push({ fileName: file.name, error: error.message });
      results.push({ fileName: file.name, success: false, error: error.message });
    }
  }

  return {
    results,
    errors: errors.length > 0 ? errors : null,
    success: errors.length === 0
  };
};

export { extractTextFromPDF, batchProcessPDFs };