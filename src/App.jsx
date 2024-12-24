import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload.jsx';
import ScoreDisplay from './components/ScoreDisplay.jsx';
import { processResume } from './services/resumeProcessor.js';
import './App.css';

function App() {
  const [serviceInitialized, setServiceInitialized] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [score, setScore] = useState(null);

  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const initServices = async () => {
      try {
        setServiceInitialized(true);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Service initialization failed:', err);
        }
        setServiceError('Failed to initialize services. Please try again later.');
      }
    };
    initServices();
  }, []);

  useEffect(() => {
    setIsSubmitEnabled(file !== null && jobDescription.trim() !== '');
  }, [file, jobDescription]);
  const handleFileUpload = (uploadedFile) => {
    try {
      if (!serviceInitialized) {
        throw new Error('Services not initialized. Please wait or refresh the page.');
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
        throw new Error('Please provide a job description');
      }

      const response = await processResume(file, jobDescription);
      setAnalysisResponse(response);
      console.log("fullll:",response);
      setScore(response.score);
      setFeedback(response.feedback || []);
      setSuggestions(response.suggestions || []);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Resume processing error:', err);
      }
      const errorMessage = err.code === 'MODULE_NOT_FOUND'
        ? 'Required module not found. Please check system configuration.'
        : err.message || 'Error processing resume. Please try again.';
      setSubmissionError(errorMessage);
      setScore(null);
      setFeedback([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDescription = (description) => {
    setJobDescription(description);
  };

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <h1 className="header-title" aria-label="main heading">ATS Resume Scorer</h1>
        <p className="header-description" aria-label="application description">
          Upload your resume and job description to get an ATS compatibility score and detailed feedback to improve your chances.
        </p>
      </header>
      <main className="main-content">
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
          <div className="error-message mt-4">{submissionError}</div>
        )}
        {isSubmitEnabled && (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Analyze Resume'}
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
      </main>
      <footer className="app-footer" role="contentinfo" aria-label="Page footer">
        Made with ♥ by AI
      </footer>
    </div>
  );
}

export default App;
