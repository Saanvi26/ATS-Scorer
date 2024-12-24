import { useState, useEffect, useContext } from "react";
import FileUpload from "./components/FileUpload.jsx";
import ScoreDisplay from "./components/ScoreDisplay.jsx";
import APIKeyInput from "./components/APIKeyInput.jsx";
import { processResume } from "./services/resumeProcessor.js";
import  OpenAIContext,{ OpenAIProvider}  from "./context/OpenAIContext";
import { ErrorBoundary } from "react-error-boundary";
import { clearApiKey } from "./utils/apiKeyUtils";
import "./App.css";

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-container">
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </div>
);

function AppContent() {
  const { hasValidKey, isLoading: apiKeyLoading, apiKeyError, validateStoredKey } = useContext(OpenAIContext);
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [score, setScore] = useState(null);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setServiceInitialized(true);
  }, []);

  useEffect(() => {
    setIsSubmitEnabled(file !== null && jobDescription.trim() !== "");
  }, [file, jobDescription]);

  const handleFileUpload = (uploadedFile) => {
    try {
      if (!serviceInitialized) {
        throw new Error(
          "Services not initialized. Please wait or refresh the page."
        );
      }
      setUploadError(null);
      setSubmissionError(null);
      setFile(uploadedFile);
    } catch (err) {
      setUploadError(err.message);
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setSubmissionError(null);

      if (!jobDescription.trim()) {
        throw new Error("Please provide a job description");
      }

      const response = await processResume(file, jobDescription);
      setAnalysisResponse(response);
      setScore(response.score);
      setFeedback(response.feedback || []);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Resume processing error:", err);
      }
      const errorMessage =
        err.code === "MODULE_NOT_FOUND"
          ? "Required module not found. Please check system configuration."
          : err.message || "Error processing resume. Please try again.";
      setSubmissionError(errorMessage);
      setScore(null);
      setFeedback([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const { handleApiKey } = useContext(OpenAIContext);
  // const  {clearApiKey}  = useContext(OpenAIContext);

  const handleJobDescription = (description) => {
    setJobDescription(description);
  };

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <h1 className="header-title" aria-label="main heading">
          ATS Resume Scorer
        </h1>
        <p className="header-description" aria-label="application description">
          Upload your resume and job description to get an ATS compatibility
          score and detailed feedback to improve your chances.
        </p>
      </header>
      <main className="main-content">
        {apiKeyLoading ? (
          <div className="loading-message" role="status">
            Validating API key...
          </div>
        ) : apiKeyError ? (
          <div className="error-container">
            <div className="error-message" role="alert">
              {apiKeyError.includes("Invalid API key")
                ? "Your API key appears to be invalid. Please check and try again."
                : "There was an issue with your API key. Please try again."}
            </div>
            <APIKeyInput onKeySubmit={handleApiKey} />
          </div>
        ) : !hasValidKey ? (
          <div className="api-key-container">
            <p className="instruction-text">
              Please enter your OpenAI API key to continue:
            </p>
            <APIKeyInput onKeySubmit={handleApiKey} />
          </div>
        ) : (
          <>
            {serviceError && (
              <div className="error-message">{serviceError}</div>
            )}
            <FileUpload
              onFileUpload={handleFileUpload}
              onJobDescription={handleJobDescription}
              isLoading={isLoading}
              error={uploadError}
              disabled={!serviceInitialized || !!serviceError}
            />
            {submissionError && (
              <>
              <div className="error-message mt-4" style={{ color: "red" }}>
                {submissionError}
              </div>
              </>
            )}
            {isSubmitEnabled && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? "Processing..." : "Analyze Resume"}
              </button>
            )}
            {score && (
              <ScoreDisplay
                score={analysisResponse.score}
                feedback={analysisResponse.feedback}
                suggestions={analysisResponse.suggestions}
                matchPercentage={analysisResponse.matchPercentage}
                keywordMatches={analysisResponse.keywordMatches}
                missingKeywords={analysisResponse.missingKeywords}
                detailedAnalysis={analysisResponse.detailedAnalysis}
                isLoading={isLoading}
              />
            )}
          </>
        )}
      </main>
      {hasValidKey && (
        <button
          onClick={clearApiKey}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          aria-label="Reset API Key"
        >
          Reset API Key
        </button>
      )}
      <footer
        className="app-footer"
        role="contentinfo"
        aria-label="Page footer"
      >
        Made with ♥ by AI
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <OpenAIProvider>
        <AppContent />
      </OpenAIProvider>
    </ErrorBoundary>
  );
}

export default App;
