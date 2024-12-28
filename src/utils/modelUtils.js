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

export const getModel = () => {
  return handleModelOperation(() => {
    const storedModel = localStorage.getItem(LOCAL_STORAGE_KEYS.MODEL);
    return storedModel || DEFAULT_MODEL;
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

export const getAvailableModels = () => {
  return handleModelOperation(() => {
    return Object.entries(OPENAI_MODELS).map(([id, name]) => ({
      id,
      name
    }));
  });
};