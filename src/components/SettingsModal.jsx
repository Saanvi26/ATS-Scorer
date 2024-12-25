import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import APIKeyInput from './APIKeyInput';
import { useOpenAIContext } from '../context/OpenAIContext';
import { getApiKey, validateApiKey, removeApiKey } from '../utils/apiKeyUtils';
import '../styles/components/SettingsModal.css';
const SettingsModal = ({ isOpen, onClose, defaultOpen = false }) => {
  const { validateStoredKey, isLoading: contextLoading } = useOpenAIContext();
  const [currentKey, setCurrentKey] = useState(null);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const isValid = await validateApiKey(key);
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

  const handleKeySubmit = async () => {
    await loadStoredKeys();
    setIsAddingKey(false);
  };

  const handleModalClose = (e) => {
    if (!currentKey || !isKeyValid) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && currentKey && isKeyValid) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`settings-modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleModalClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="settings-modal-container"
        onClick={e => e.stopPropagation()}
        role="document"
      >
        <header className="settings-modal-header" aria-labelledby="settings-title settings-subtitle">
          <h2 id="settings-title" className="settings-modal-title">OpenAI API Key Settings</h2>
          <p id="settings-subtitle" className="settings-modal-subtitle">Enter your OpenAI API key to use the ATS Resume Scorer. Your key is stored locally and never sent to our servers.</p>
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
          <div 
            className="error-message" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {isLoading || contextLoading ? (
          <div className="text-center py-4" role="status" aria-live="polite">
            <span className="settings-spinner" aria-hidden="true">⟳</span>
            Loading...
          </div>
        ) : (
          <div className="space-y-4" role="region" aria-label="API key management">
            {currentKey && (
              <div className="api-key-item">
                <div className="flex items-center space-x-2">
                  <span className={`api-key-status ${isKeyValid ? 'valid' : 'invalid'}`}></span>
                  <span className="api-key-value">•••• {currentKey.slice(-4)}</span>
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