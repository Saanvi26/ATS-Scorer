import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { validateApiKey, storeApiKey, getApiKey, hasApiKey, ApiKeyValidationError, ApiKeyStorageError } from '../utils/apiKeyUtils';
import OpenAIClientFactory from '../services/OpenAIClientFactory';
import { useOpenAIContext } from '../context/OpenAIContext';
import '../styles/components/APIKeyInput.css';
const APIKeyInput = ({ onKeySubmit }) => {
  const { validateStoredKey } = useOpenAIContext();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(false);
      setError('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error]);

  useEffect(() => {
    const checkExistingKey = async () => {
      if (hasApiKey()) {
        const storedKey = getApiKey();
        if (storedKey && validateStoredKey()) {
          setIsUpdateMode(true);
        }
      }
    };

    checkExistingKey();

    const handleApiKeyEvent = (event) => {
      if (event.detail.type === 'stored' && event.detail.success) {
        setIsUpdateMode(true);
      }
    };

    window.addEventListener('apiKey', handleApiKeyEvent);

    return () => {
      window.removeEventListener('apiKey', handleApiKeyEvent);
      const instance = OpenAIClientFactory.getInstance();
      if (instance.isInitialized()) {
        instance.reinitializeClient();
      }
    };
  }, [validateStoredKey]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    if (!apiKey || apiKey.trim() === '') {
      setError('Please enter an API key');
      setIsLoading(false);
      return;
    }

    try {
      await storeApiKey(apiKey);
      OpenAIClientFactory.getInstance().reinitializeClient();
      
      if (onKeySubmit) {
        await onKeySubmit(apiKey);
      }
      
      setSuccess(true);
      setApiKey('');
    } catch (err) {
      if (err instanceof ApiKeyValidationError) {
        setError('Invalid API key: ' + err.message);
      } else if (err instanceof ApiKeyStorageError) {
        setError('Failed to store API key: ' + err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="api-key-input-container p-4 rounded shadow">
      <form onSubmit={handleSubmit}>
        <div className="input-group m-4">
          <label 
            htmlFor="apiKey" 
            className="label-text block mb-2"
          >
            OpenAI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input-field w-full p-2 rounded"
            placeholder="Enter your OpenAI API key"
            aria-describedby={error ? "error-message" : undefined}
            aria-invalid={error ? "true" : "false"}
            aria-required="true"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div 
            id="error-message" 
            className="error-message p-2 m-2 rounded" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="success-message p-2 m-2 rounded"
            role="alert"
            aria-live="polite"
          >
            API key successfully stored!
          </div>
        )}

        <button
          type="submit"
          className={`submit-button p-2 m-2 rounded ${
            isLoading ? 'loading' : ''
          }`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true">⟳</span>
              Validating...
            </>
          ) : isUpdateMode ? (
            'Update API Key'
          ) : (
            'Submit API Key'
          )}
        </button>
      </form>
    </div>
  );
};

APIKeyInput.propTypes = {
  onKeySubmit: PropTypes.func
};

export default APIKeyInput;