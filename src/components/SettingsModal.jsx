import { useState, useEffect,useRef } from 'react';
import PropTypes from 'prop-types';
import APIKeyInput from './APIKeyInput';
import ModelSelector from './ModelSelector';
import { useOpenAIContext } from '../context/OpenAIContext';
import { getApiKey, validateApiKey, removeApiKey } from '../utils/apiKeyUtils';
import '../styles/components/SettingsModal.css';
const SettingsModal = ({ isOpen, onClose, defaultOpen = false }) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const { validateStoredKey, isLoading: contextLoading, selectedModel, setSelectedModel, modelError } = useOpenAIContext();
  const [currentKey, setCurrentKey] = useState(null);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadStoredKeys();
    }
  }, [isOpen]);

const loadStoredKeys = async () => {
  setIsLoading(true);
  try {
    const key = getApiKey();
    if (key) {
      const isValid = validateApiKey(key);
      setCurrentKey(key);
      setIsKeyValid(isValid);
    } else {
      setCurrentKey(null);
      setIsKeyValid(false);
    }
  } catch (err) {
    setError('Failed to load API key');
  } finally {
    setIsLoading(false);
  }
};

const handleRemoveKey = async () => {
  try {
    await removeApiKey();
    setCurrentKey(null);
    setIsKeyValid(false);
  } catch (err) {
    setError('Failed to remove API key');
  }
};

  const handleKeySubmit = async (key) => {
    setIsLoading(true);
    setError('');
    try {
      const isValid = await validateApiKey(key);
      if (!isValid) {
        setError('Invalid API key. Please check and try again.');
        return;
      }
      await validateStoredKey();
      await loadStoredKeys();
      setIsAddingKey(false);
      if (isValid && selectedModel) {
        onClose();
      } else if (!selectedModel) {
        setError('Please select a model before closing');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to validate API key';
      setError(errorMessage);
      console.error('API key validation error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = async (e) => {
    if (e.target === e.currentTarget) {
      setIsLoading(true);
      try {
        if (!currentKey) {
          setError('Please add an API key before closing');
          return;
        }
        const isValid = await validateApiKey(currentKey);
        if (!isValid) {
          setError('Please ensure your API key is valid before closing');
          return;
        }
        if (!selectedModel) {
          setError('Please select a model before closing');
          return;
        }
        await validateStoredKey();
        onClose();
      } catch (err) {
        setError('Failed to validate settings. Please try again.');
        console.error('Settings validation error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Escape') {
      if (currentKey && isKeyValid) {
        await validateStoredKey();
        onClose();
      } else if (currentKey && !isKeyValid) {
        setError('Please ensure your API key is valid before closing');
      } else {
        setError('Please add an API key before closing');
      }
    } else if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`settings-modal-overlay ${isOpen ? "open" : ""}`}
      onClick={handleModalClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        ref={modalRef}
        className="settings-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        tabIndex="-1"
        aria-modal="true"
      >
        <header
          className="settings-modal-header"
          aria-labelledby="settings-title settings-subtitle"
        >
          <h2 id="settings-title" className="settings-modal-title">
            OpenAI API Key Settings
          </h2>
          <p id="settings-subtitle" className="settings-modal-subtitle">
            Enter your OpenAI API key to use the ATS Resume Scorer. Your key is
            stored locally and never sent to our servers.
          </p>
          {currentKey && isKeyValid && (
            <button
              onClick={onClose}
              className="settings-modal-close"
              aria-label="Close settings"
            >
              ×
            </button>
          )}
        </header>

        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {isLoading || contextLoading ? (
          <div 
            className="text-center py-4" 
            role="status" 
            aria-live="polite"
            aria-busy="true"
          >
            <span className="settings-spinner" aria-hidden="true">
              ⟳
            </span>
            <span className="sr-only">Validating API key and settings...</span>
            <span aria-hidden="true">Loading...</span>
          </div>
        ) : (
          <div
            className="space-y-4"
            role="region"
            aria-label="API key management"
          >
            {currentKey && (
              <div className="api-key-item">
                <div className="flex items-center space-x-2">
                  <span
                    className={`api-key-status ${
                      isKeyValid ? "valid" : "invalid"
                    }`}
                  ></span>
                  <span className="api-key-value">
                    •••• {currentKey.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={handleRemoveKey}
                  className="remove-key-button"
                  aria-label="Remove API key"
                >
                  Remove
                </button>
              </div>
            )}

            {!currentKey && !isAddingKey ? (
              <div className="no-key-message" role="alert">
                <p className="text-center text-lg font-medium mb-4">
                  You need an OpenAI API key to use this application
                </p>
                <button
                  onClick={() => setIsAddingKey(true)}
                  className="add-key-button add-key-button-highlight"
                  aria-label="Add OpenAI API key"
                >
                  Add Your API Key
                </button>
              </div>
            ) : isAddingKey ? (
              <div className="mt-4">
                <APIKeyInput onKeySubmit={handleKeySubmit} />
                <button
                  onClick={() => setIsAddingKey(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingKey(true)}
                className="add-key-button"
                aria-label="Add new API key"
              >
                Add New API Key
              </button>
            )}

            <div
              className="model-selector-section"
              role="region"
              aria-label="Model Selection"
            >
              <div className="model-selector-content">
                <div className="model-selector-header">
                  <h3 className="model-selector-title">Model Selection</h3>
                  <p className="model-selector-description">
                    Choose the OpenAI model to use for resume analysis.
                  </p>
                </div>

                <div className="model-selector-container">
                  <div className="model-selector-wrapper">
                    <ModelSelector
                      onModelSelect={setSelectedModel}
                      onCancel={onClose}
                    />
                    {modelError && (
                      <div className="error-message model-error" role="alert">
                        {modelError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  defaultOpen: PropTypes.bool
};

export default SettingsModal;