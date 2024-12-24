import { useState, useEffect } from 'react';
import OpenAIClientFactory from '../services/OpenAIClientFactory';
import { ApiKeyError } from '../utils/apiKeyUtils';

const useOpenAI = () => {
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [keySource, setKeySource] = useState(null);
  const clientFactory = OpenAIClientFactory.getInstance();

  const initializeClient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const storedKey = getApiKey();
      if (storedKey) {
        setKeySource('localStorage');
      } else {
        setKeySource('env');
      }
      
      const newClient = clientFactory.getClient();
      setClient(newClient);
    } catch (err) {
      setError(err instanceof ApiKeyError 
        ? { ...err, source: keySource } 
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

  return {
    client,
    error,
    isLoading,
    keySource,
    isClientReady,
    reinitializeClient,
    getCurrentApiKey
  };
};

export default useOpenAI;