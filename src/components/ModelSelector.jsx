import { useState } from 'react';
import PropTypes from 'prop-types';
import { OPENAI_MODELS, DEFAULT_MODEL } from '../utils/constants';
import { useOpenAIContext } from '../context/OpenAIContext';
import { toast } from 'react-toastify';
import '../styles/components/ModelSelector.css';

const ModelSelector = ({ onModelSelect, onCancel }) => {
  const { currentModel } = useOpenAIContext();
  const [selectedModel, setSelectedModel] = useState(
    currentModel || DEFAULT_MODEL
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
              {Object.entries(OPENAI_MODELS).map(([key, value]) => (
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