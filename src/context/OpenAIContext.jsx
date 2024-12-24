import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useOpenAI from '../hooks/useOpenAI';
import { hasApiKey } from '../utils/apiKeyUtils';

/**
 * @typedef {Object} OpenAIContextValue
 * @property {Object|null} client - The OpenAI client instance
 * @property {Error|null} error - Any error that occurred during initialization
 * @property {boolean} isLoading - Loading state of the client
 * @property {boolean} isClientReady - Whether the client is ready to use
 * @property {boolean} hasValidKey - Whether there is a valid API key
 * @property {string|null} apiKeyError - Specific error message for API key issues
 * @property {Function} reinitializeClient - Function to reinitialize the client
 * @property {Function} getCurrentApiKey - Function to get the current API key
 * @property {Function} validateStoredKey - Function to validate the stored key
 */

/** @type {React.Context<OpenAIContextValue>} */
const OpenAIContext =createContext(null);


export const OpenAIProvider = ({ children }) => {
  const openAI = useOpenAI();
  
  const validateStoredKey = () => hasApiKey();

  const value = {
    client: openAI.client,
    error: openAI.error,
    isLoading: openAI.isLoading,
    isClientReady: openAI.isClientReady,
    hasValidKey: validateStoredKey(),
    apiKeyError: openAI.error?.name === 'ApiKeyError' ? openAI.error.message : null,
    reinitializeClient: openAI.reinitializeClient,
    getCurrentApiKey: openAI.getCurrentApiKey,
    validateStoredKey
  };
  return (
    <OpenAIContext.Provider value={value}>
      {children}
    </OpenAIContext.Provider>
  );
};

OpenAIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useOpenAIContext = () => {
  const context = useContext(OpenAIContext);
  if (!context) {
    throw new Error('useOpenAIContext must be used within an OpenAIProvider');
  }
  return context;
};

export default OpenAIContext;