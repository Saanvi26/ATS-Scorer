import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { OPENAI_MODELS } from '../utils/constants';
import { useOpenAIContext } from '../context/OpenAIContext';
import { toast } from 'react-toastify';
import '../styles/components/ModelSelector.css';
import { getModel } from '../utils/modelUtils';

/**
 * Sorts the model options to display the selected model first
 * @param {string} selectedModel - The currently selected model
 * @param {Object} models - Object containing available OpenAI models
 * @returns {Array<[string, string]>} Sorted array of model entries
 * @throws {Error} If the models object is empty
 */
const getSortedModelOptions = (selectedModel, models) => {
  if (!models || Object.keys(models).length === 0) {
    throw new Error('No models available');
  }
  const modelEntries = Object.entries(models);
  
  // If selected model exists in models, move it to the front
  if (models[selectedModel]) {
    const selectedEntry = modelEntries.find(([key]) => key === selectedModel);
    const remainingEntries = modelEntries.filter(([key]) => key !== selectedModel);
    return [selectedEntry, ...remainingEntries];
  }
  
  // If selected model doesn't exist, use default order but log a warning
  console.warn(`Selected model ${selectedModel} not found in available models`);
  return modelEntries;
};

const ModelSelector = ({ onModelSelect, onCancel }) => {
  // Initialize with stored model from localStorage
  const [selectedModel, setSelectedModel] = useState(() => {
    try {
      return getModel();
    } catch (err) {
      console.error('Error loading stored model:', err);
      return Object.keys(OPENAI_MODELS)[0];
    }
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize with localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'openai_model') {
        try {
          const newModel = getModel();
          setSelectedModel(newModel);
        } catch (err) {
          console.error('Error syncing with localStorage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (!selectedModel) {
        throw new Error("Please select a model");
      }

      if (!OPENAI_MODELS[selectedModel]) {
        throw new Error("Invalid model selection");
      }


      await onModelSelect(selectedModel);

      if (onCancel) {
        onCancel();
        toast.success("Model selection successfully saved!");
      }
    } catch (err) {
      const errorMessage = err.message || "An unexpected error occurred";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="model-selector">
      <form onSubmit={handleSubmit} className="model-selector__form">
        <div className="model-selector__group">
          <label htmlFor="modelSelect" className="model-selector__label">
            Select OpenAI Model
          </label>
          <div
            style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
            className={`model-selector__wrapper ${
              isLoading ? "model-selector__loading" : ""
            }`}
          >
            <select
              id="modelSelect"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-selector__select"
              aria-describedby={error ? "error-message" : "model-description"}
              aria-invalid={error ? "true" : "false"}
              aria-required="true"
              disabled={isLoading}
              aria-label="Select an OpenAI model for analysis"
            >
              {getSortedModelOptions(selectedModel, OPENAI_MODELS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            id="error-message"
            className="model-selector__message model-selector__message--error"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          className={`model-selector__button ${
            isLoading ? "model-selector__button--loading" : ""
          }`}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true">
                ⟳
              </span>
              Saving...
            </>
          ) : (
            "Save Model Selection"
          )}
        </button>
      </form>
    </div>
  );
};

ModelSelector.propTypes = {
  onModelSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ModelSelector;