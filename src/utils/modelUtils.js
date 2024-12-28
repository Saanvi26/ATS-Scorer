import { OPENAI_MODELS, LOCAL_STORAGE_KEYS, DEFAULT_MODEL } from './constants';

export class ModelError extends Error {
  constructor(message, type = 'GENERAL_ERROR') {
    super(message);
    this.name = 'ModelError';
    this.type = type;
  }
}

export class ModelValidationError extends ModelError {
  constructor(message, subtype = 'GENERAL_VALIDATION') {
    super(message, `VALIDATION_${subtype}`);
  }
}

export class ModelStorageError extends ModelError {
  constructor(message, subtype = 'GENERAL_STORAGE') {
    super(message, `STORAGE_${subtype}`);
  }
}

const dispatchModelEvent = (type, detail = {}) => {
  const event = new CustomEvent('model', {
    detail: { type, ...detail },
    bubbles: true
  });
  window.dispatchEvent(event);
};

const handleModelOperation = (operation) => {
  try {
    return operation();
  } catch (error) {
    throw new ModelError(error.message);
  }
};

export const validateModel = (model) => {
  return handleModelOperation(() => {
    if (!model) {
      throw new ModelValidationError('Model is required', 'MISSING_MODEL');
    }
    if (!OPENAI_MODELS[model]) {
      throw new ModelValidationError('Invalid model selection', 'INVALID_MODEL');
    }
    return true;
  });
};

export const storeModel = (model) => {
  return handleModelOperation(() => {
    if (!validateModel(model)) {
      throw new ModelValidationError('Invalid model', 'VALIDATION_FAILED');
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.MODEL, model);
    dispatchModelEvent('stored', { success: true, model });
    return true;
  });
};

/**
 * Retrieves the currently selected OpenAI model from localStorage
 * If no model is stored or the stored model is invalid, returns the default model
 * 
 * @returns {string} The current OpenAI model identifier
 * @throws {ModelStorageError} If the stored model is invalid or not available
 * @throws {ModelValidationError} If the default model is not available
 */
export const getModel = () => {
  return handleModelOperation(() => {
    const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL);
    
    if (storedModel) {
      try {
        validateModel(storedModel);
        return storedModel;
      } catch (error) {
        throw new ModelStorageError(
          'The previously selected model is no longer available. Reverting to default model.',
          'INVALID_STORED_MODEL'
        );
      }
    }
    
    // Validate default model
    try {
      validateModel(DEFAULT_MODEL);
      return DEFAULT_MODEL;
    } catch (error) {
      throw new ModelValidationError(
        'The default model is not available. Please check your configuration.',
        'INVALID_DEFAULT_MODEL'
      );
    }
  });
};

export const clearModel = () => {
  return handleModelOperation(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.MODEL);
    dispatchModelEvent('cleared', { success: true });
    return true;
  });
};

export const hasStoredModel = () => {
  return handleModelOperation(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL) !== null;
  });
};

export const initializeWithStoredModel = () => {
  return handleModelOperation(() => {
    const model = getModel();
    if (!validateModel(model)) {
      throw new ModelStorageError('Invalid stored model');
    }
    dispatchModelEvent('initialized', { success: true, model });
    return model;
  });
};

/**
 * Sorts the available models to display the selected model first
 * @param {string} selectedModel - The currently selected model
 * @returns {Array<{id: string, name: string}>} Sorted array of model objects
 * @throws {ModelValidationError} If no models are available or if selected model is invalid
 */
export const getModelDisplayOrder = () => {
  return handleModelOperation(() => {
    const selectedModel = getModel();
    validateModel(selectedModel);

    const modelEntries = Object.entries(OPENAI_MODELS);
    if (modelEntries.length === 0) {
      throw new ModelValidationError('No models available', 'EMPTY_MODELS');
    }

    // Find selected model entry
    const selectedEntry = modelEntries.find(([key]) => key === selectedModel);
    if (!selectedEntry) {
      throw new ModelValidationError('Selected model not found', 'INVALID_MODEL');
    }

    // Get remaining entries
    const remainingEntries = modelEntries.filter(([key]) => key !== selectedModel);

    // Combine and transform to required format
    return [...[selectedEntry], ...remainingEntries].map(([id, name]) => ({
      id,
      name
    }));
  });
};
export const getAvailableModels = () => {
  return handleModelOperation(() => {
    return Object.entries(OPENAI_MODELS).map(([id, name]) => ({
      id,
      name
    }));
  });
};