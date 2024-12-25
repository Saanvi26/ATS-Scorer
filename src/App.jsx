import { useState, useEffect, useContext } from "react";
import FileUpload from "./components/FileUpload.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import ScoreDisplay from "./components/ScoreDisplay.jsx";
import APIKeyInput from "./components/APIKeyInput.jsx";
import { processResume } from "./services/resumeProcessor.js";
import { OpenAIProvider, useOpenAIContext } from "./context/OpenAIContext";
import GearIcon from "./components/icons/GearIcon";
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
  const { hasValidKey, isLoading: apiKeyLoading, apiKeyError, validateStoredKey } = useOpenAIContext();
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!hasValidKey);
  const [serviceError, setServiceError] = useState(null);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [score, setScore] = useState(null);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const clearAnalysisStates = () => {
    setScore(null);
    setAnalysisResponse(null);
    setFeedback([]);
    setSuggestions([]);
    setSubmissionError(null);
  };

  useEffect(() => {
    if (!hasValidKey) {
      setIsSettingsOpen(true);
    }
  }, [hasValidKey]);

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

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
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    if (!uploadedFile) {
      clearAnalysisStates();
      setFile(null);
      setFileUrl(null);
      return;
    }
    const newFileUrl = URL.createObjectURL(uploadedFile);
    setFileUrl(newFileUrl);
    setFile(uploadedFile);
  } catch (err) {
    setUploadError(err.message);
    setFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    clearAnalysisStates();
  }
};

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setSubmissionError(null);

      if (!file) {
        throw new Error("Please upload a resume file");
      }

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

  const { addApiKey: handleApiKey } = useOpenAIContext();
  const handleJobDescription = (description) => {
    setJobDescription(description);
  };

  return (
    <>
      <div className="app-container">
      <button
        className={`settings-button ${!hasValidKey ? 'settings-button-highlight' : ''}`}
        onClick={() => {
          setIsSettingsOpen(true);
          validateStoredKey();
        }}
        aria-label="Open settings"
      >
        <GearIcon size={50} color={!hasValidKey ? '#ff6b6b' : 'currentColor'} />
      </button>
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
        {!hasValidKey ? (
          <div className="no-api-key-prompt">
            <p className="instruction-text">
              Please configure your OpenAI API key in settings to use this application.
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="open-settings-button"
            >
              Open Settings
            </button>
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
              fileUrl={fileUrl}
            />
            {submissionError && (
              <div className="error-message mt-4" style={{ color: "red" }}>
                {submissionError}
              </div>
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
            {file && score && analysisResponse && (
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
      <footer
        className="app-footer"
        role="contentinfo"
        aria-label="Page footer"
      >
        Made with ♥ by AI
      </footer>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      </div>
    </>
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
