import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { storeApiKey, getApiKey, hasApiKey, ApiKeyValidationError, ApiKeyStorageError } from '../utils/apiKeyUtils';
import OpenAIClientFactory from '../services/OpenAIClientFactory';
import { useOpenAIContext } from '../context/OpenAIContext';
import '../styles/components/APIKeyInput.css';
const APIKeyInput = ({ onKeySubmit, onCancel }) => {
  const { validateStoredKey } = useOpenAIContext();
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(false);
      setError('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error]);

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
      await storeApiKey(apiKey.trim());
      OpenAIClientFactory.getInstance().reinitializeClient();
      
      if (onKeySubmit) {
        await onKeySubmit(apiKey.trim());
      }
      
      setSuccess(true);
      setApiKey('');
      setIsUpdateMode(true);
    } catch (err) {
      if (err instanceof ApiKeyValidationError) {
        setError('The API key appears to be invalid. Please check your settings and try again.');
      } else if (err instanceof ApiKeyStorageError) {
        setError('Unable to save the API key in settings. Please try again.');
      } else {
        setError('Unable to update settings. Please try again later.');
        console.error('Settings Update Error:', err);
      }
    } finally {
      setIsLoading(false);
    }};
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
            API key successfully saved in settings!
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
            'Save Changes'
          ) : (
            'Save API Key'
          )}
        </button>
      </form>
    </div>
  );
};

APIKeyInput.propTypes = {
  onKeySubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default APIKeyInput;