import OpenAI from 'openai';
import { getApiKey, ApiKeyError } from '../utils/apiKeyUtils.js';

class OpenAIClientFactory {
  static instance = null;
  #client = null;
  #currentApiKey = null;

  constructor() {
    if (OpenAIClientFactory.instance) {
      throw new Error('Use OpenAIClientFactory.getInstance() instead of new operator');
    }
    this.#setupEventListeners();
  }

  static getInstance() {
    if (!OpenAIClientFactory.instance) {
      OpenAIClientFactory.instance = new OpenAIClientFactory();
    }
    return OpenAIClientFactory.instance;
  }

  #setupEventListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'openai_api_key') {
        this.reinitializeClient();
      }
    });
  }

  #validateAndCreateClient(apiKey) {
    if (!apiKey) {
      throw new ApiKeyError('OpenAI API key not found. Please set your API key in settings.', 'MISSING_KEY');
    }

    try {
      return new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      if (error instanceof ApiKeyError) {
        throw error;
      }
      throw new ApiKeyError('Failed to create OpenAI client', 'CLIENT_ERROR');
    }
  }

  getClient() {
    try {
      let apiKey = getApiKey();
      
      if (!apiKey) {
        apiKey = this.initializeFromEnv();
      }

      if (!this.#client || this.#currentApiKey !== apiKey) {
        this.#client = this.#validateAndCreateClient(apiKey);
        this.#currentApiKey = apiKey;
      }

      return this.#client;
    } catch (error) {
      this.#client = null;
      this.#currentApiKey = null;
      throw error;
    }
  }

  reinitializeClient() {
    this.#client = null;
    this.#currentApiKey = null;
    return this.getClient();
  }

  isInitialized() {
    return !!this.#client;
  }

  getCurrentApiKey() {
    return this.#currentApiKey;
  }

  initializeFromEnv() {
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!envApiKey) {
      throw new ApiKeyError('No API key found in environment variables or local storage', 'MISSING_KEY');
    }
    return envApiKey;
  }
}

export default OpenAIClientFactory;