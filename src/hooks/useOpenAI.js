import { useState, useEffect } from 'react';
import OpenAIClientFactory from '../services/OpenAIClientFactory';
import { ApiKeyError } from '../utils/apiKeyUtils';

const useOpenAI = () => {
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keySource, setKeySource] = useState(null);
  const [storedKeys, setStoredKeys] = useState([]);
  const [keyValidationStatus, setKeyValidationStatus] = useState({});
  const clientFactory = OpenAIClientFactory.getInstance();

  const initializeClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const keys = getAllStoredApiKeys();
      setStoredKeys(keys);
      
      const validationResults = await validateMultipleApiKeys(keys);
      const validationStatus = {};
      validationResults.forEach(({ key, isValid }) => {
        validationStatus[key] = isValid;
      });
      setKeyValidationStatus(validationStatus);
      
      if (keys.length > 0) {
        setKeySource('localStorage');
      } else {
        setKeySource('env');
      }
      
      const newClient = clientFactory.getClient();
      setClient(newClient);
    } catch (err) {
      setError(err instanceof ApiKeyError 
        ? { ...err, source: keySource, keys: storedKeys } 
        : new Error('Failed to initialize OpenAI client'));
      setClient(null);
      setKeySource(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeClient();

    const handleStorageChange = (event) => {
      if (event.key === 'openai_api_key') {
        if (event.newValue === null) {
          setKeySource('env');
        }
        initializeClient();
      }
    };

    const handleApiKeyEvent = (event) => {
      if (event.detail.type === 'stored' || event.detail.type === 'initialized') {
        setKeySource('localStorage');
        initializeClient();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apiKey', handleApiKeyEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKey', handleApiKeyEvent);
    };
  }, []);

  const reinitializeClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const storedKey = getApiKey();
      setKeySource(storedKey ? 'localStorage' : 'env');
      const newClient = clientFactory.reinitializeClient();
      setClient(newClient);
    } catch (err) {
      setError(err instanceof ApiKeyError 
        ? { ...err, source: keySource } 
        : new Error('Failed to reinitialize OpenAI client'));
      setClient(null);
      setKeySource(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isClientReady = () => {
    return !isLoading && !error && client !== null;
  };

  const getCurrentApiKey = () => {
    return clientFactory.getCurrentApiKey();
  };

  const addApiKey = async (key) => {
    try {
      await storeApiKey(key);
      await initializeClient();
    } catch (err) {
      setError(new ApiKeyError('Failed to add API key', 'ADD_KEY_ERROR'));
    }
  };

  const removeApiKey = async (key) => {
    try {
      await removeStoredApiKey(key);
      await initializeClient();
    } catch (err) {
      setError(new ApiKeyError('Failed to remove API key', 'REMOVE_KEY_ERROR'));
    }
  };
  return {
    client,
    error,
    isLoading,
    keySource,
    storedKeys,
    keyValidationStatus,
    isClientReady,
    reinitializeClient,
    getCurrentApiKey,
    addApiKey,
    removeApiKey
  };
};

export default useOpenAI;