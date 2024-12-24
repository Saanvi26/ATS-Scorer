
const STORAGE_KEY = 'openai_api_key';
const ENV_KEY = 'REACT_APP_OPENAI_API_KEY';

const KEY_SOURCE = 'api_key_source';

export class ApiKeyError extends Error {
  constructor(message, type = 'GENERAL_ERROR') {
    super(message);
    this.name = 'ApiKeyError';
    this.type = type;
  }
}

export class ApiKeyValidationError extends ApiKeyError {
  constructor(message, subtype = 'GENERAL_VALIDATION') {
    super(message, `VALIDATION_${subtype}`);
  }
}

export class ApiKeyStorageError extends ApiKeyError {
  constructor(message, subtype = 'GENERAL_STORAGE') {
    super(message, `STORAGE_${subtype}`);
  }
}

export class ApiKeySourceError extends ApiKeyError {
  constructor(message) {
    super(message, 'SOURCE_ERROR');
  }
}

const validationCache = new WeakMap();

const dispatchApiKeyEvent = (type, detail = {}) => {
  const event = new CustomEvent('apiKey', {
    detail: { type, ...detail },
    bubbles: true
  });
  window.dispatchEvent(event);
};

const handleApiKeyOperation = (operation) => {
  try {
    return operation();
  } catch (error) {
    throw new ApiKeyError(error.message);
  }
};

export const validateApiKey = (key) => {
  return true;
};

export const checkEnvApiKey = () => {
  return handleApiKeyOperation(() => {
    const envKey = process.env[ENV_KEY];
    if (!envKey) return null;
    return envKey;
  });
};

export const getKeySource = () => {
  return localStorage.getItem(KEY_SOURCE) || 'env';
};

export const setKeySource = (source) => {
  if (source !== 'env' && source !== 'localStorage') {
    throw new ApiKeySourceError('Invalid key source');
  }
  localStorage.setItem(KEY_SOURCE, source);
};

export const storeApiKey = (apiKey) => {
  return handleApiKeyOperation(() => {
    if (!apiKey) {
      throw new ApiKeyValidationError('API key is required', 'MISSING_KEY');
    }

    localStorage.setItem(STORAGE_KEY, apiKey);
    setKeySource('localStorage');
    dispatchApiKeyEvent('stored', { success: true, source: 'localStorage' });
    return true;
  });
};

export const getApiKey = () => {
  return handleApiKeyOperation(() => {
    const source = getKeySource();
    if (source === 'localStorage') {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        // Migration: Check if the key is encrypted (contains ':' character)
        if (storedKey.includes(':')) {
          // For previously encrypted keys, just store them as-is without decryption
          const newKey = storedKey.split(':')[1];
          localStorage.setItem(STORAGE_KEY, newKey);
          return newKey;
        }
        return storedKey;
      }
    }
    return checkEnvApiKey();
  });
};

export const clearApiKey = () => {
  return handleApiKeyOperation(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(KEY_SOURCE);
    // reload the page to clear the API key from memory
    window.location.reload();
    dispatchApiKeyEvent('cleared', { success: true });
    return true;
  });
};

export const hasApiKey = () => {
  return handleApiKeyOperation(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });
};

export const initializeWithStoredKey = async () => {
  return handleApiKeyOperation(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new ApiKeyStorageError('No stored API key found');
    }

    dispatchApiKeyEvent('initialized', { success: true });
    return apiKey;
  });
};