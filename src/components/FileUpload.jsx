import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';
import JobDescription from './JobDescription';
import { isPDF, isValidFileSize, MAX_FILE_SIZE, generateErrorMessage } from '../utils/fileValidation';
import '../styles/components/FileUpload.css';
const FileUpload = ({ onFileUpload, onJobDescription, isLoading, error }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jobDescriptionError, setJobDescriptionError] = useState('');

  const fileReaderRef = useRef(null);

  const cleanupFileReader = () => {
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
      fileReaderRef.current = null;
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    cleanupFileReader();

    try {
      // Validate file size
      const isValidSize = await isValidFileSize(file, MAX_FILE_SIZE);
      if (!isValidSize) {
        throw new Error(generateErrorMessage('FILE_SIZE_ERROR', 'File size exceeds 10MB limit'));
      }

      // Validate PDF format
      const isValidPDF = await isPDF(file);
      if (!isValidPDF) {
        throw new Error(generateErrorMessage('PDF_VALIDATION_ERROR', 'Invalid or corrupted PDF file'));
      }

      // Simulating file upload with progress
      const uploadFile = async () => {
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      };

      await uploadFile();
      setSelectedFile(file);
      onFileUpload(file);
      setUploadProgress(0);
    } catch (err) {
      setUploadProgress(0);
      setSelectedFile(null);
      throw new Error(err.message);
    } finally {
      cleanupFileReader();
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`upload-container drag-area ${isDragActive ? 'drag-over' : ''} ${error ? 'error' : ''}`}
        role="button"
        aria-label="Upload file area"
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="upload-icon" />
        
        {isDragActive ? (
          <p className="upload-text">Drop your resume here</p>
        ) : (
          <div>
            <p className="upload-text">Drag and drop your resume here, or click to select</p>
            <p className="upload-hint">Only PDF files are accepted</p>
          </div>
        )}

        {isLoading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <p className="upload-text">Processing... {uploadProgress}%</p>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
          </div>
        )}
      </div>
      {selectedFile && (
        <div className="file-list">
          <div className="file-item">
            <FiFile className="file-icon" />
            <span className="file-name">
              {selectedFile.name}
            </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="remove-button"
            aria-label="Remove file"
          >
            <FiX />
            </button>
            </div>
        </div>
      )}
      <div className="mt-8">
        <JobDescription
          value={jobDescriptionText}
          onChange={(text) => {
            setJobDescriptionText(text);
            onJobDescription(text);
          }}
          error={jobDescriptionError}
          setError={setJobDescriptionError}
        />
      </div>
    </div>
  );
};

export default FileUpload;