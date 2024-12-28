import { ApiKeyError } from './apiKeyUtils.js';

export class ValidationError extends Error {
  constructor(message, type = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.type = type;
  }
}
import Bottleneck from 'bottleneck';
import retry from 'retry';


/**
 * API helper utilities for making HTTP requests with rate limiting and retry capabilities
 * @module apiHelpers
 */

/**
 * Creates a rate limiter instance with specified configuration
 * @param {Object} options - Rate limiting options
 * @param {number} [options.maxConcurrent=5] - Maximum concurrent requests
 * @param {number} [options.minTime=200] - Minimum time between requests in ms
 * @returns {Bottleneck} Configured rate limiter instance
 */
export const createRateLimiter = (options = {}) => {
  return new Bottleneck({
    maxConcurrent: options.maxConcurrent || 5,
    minTime: options.minTime || 200,
    ...options
  });
};

/**
 * Creates a retry operation with specified configuration
 * @param {Object} options - Retry operation options
 * @param {number} [options.retries=3] - Maximum number of retries
 * @param {number} [options.factor=2] - Exponential backoff factor
 * @param {number} [options.minTimeout=1000] - Minimum retry timeout in ms
 * @param {number} [options.maxTimeout=5000] - Maximum retry timeout in ms
 * @returns {Object} Configured retry operation
 */
export const createRetryOperation = (options = {}) => {
  return retry.operation({
    retries: options.retries || 3,
    factor: options.factor || 2,
    minTimeout: options.minTimeout || 1000,
    maxTimeout: options.maxTimeout || 5000,
    ...options
  });
};

/**
 * Handles API errors and throws appropriate error messages
 * @param {Error} error - The error object to handle
 * @throws {Error} Formatted error message
 */
export const handleApiError = (error) => {
  // Handle ApiKeyError instances first to preserve error types
  if (error instanceof ApiKeyError) {
    // Preserve the original error type and message
    throw error;
  }

  // Handle API response errors
  if (error.response) {
    if (error.response.data?.error?.function_call) {
      throw new ApiKeyError(
        `Function Call Error: ${error.response.data.error.function_call.message}`,
        'FUNCTION_CALL_ERROR'
      );
    }
    
    // Handle authentication errors
    if (error.response.status === 401) {
      throw new ApiKeyError(
        'Invalid or expired API key. Please verify your API key in settings.',
        'AUTHENTICATION_ERROR'
      );
    }
    
    // Handle rate limit errors
    if (error.response.status === 429) {
      throw new ApiKeyError(
        'API rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT_ERROR'
      );
    }
    
    throw new ApiKeyError(
      `API Error (${error.response.status}): ${error.response.data?.error?.message || 'Unknown error'}`,
      'API_ERROR'
    );
  }
  
  // Handle network errors
  if (error.request) {
    throw new ApiKeyError(
      'Network Error: Unable to reach the API server. Please check your connection.',
      'NETWORK_ERROR'
    );
  }
  
  // Handle function call errors
  if (error.name === 'FunctionCallError') {
    throw new ApiKeyError(
      `Function Call Error: ${error.message}`,
      'FUNCTION_CALL_ERROR'
    );
  }
  
  // Handle all other errors
  throw new ApiKeyError(
    `Unexpected Error: ${error.message}`,
    'GENERAL_ERROR'
  );
};

/**
 * Formats API response according to provided schema
 * @param {Object|string} response - API response to format
 * @param {Object} [schema] - Schema to filter response properties
 * @returns {Object} Formatted response object
 * @throws {Error} If response parsing fails
 */
export const formatResponse = (response, schema) => {
  try {
    let parsedResponse = response;
    
    if (typeof response === 'string') {
      try {
        parsedResponse = JSON.parse(response);
      } catch (error) {
        throw new ValidationError(`Invalid JSON response: ${error.message}`);
      }
    }
    
    // Handle function call responses
    if (parsedResponse.choices?.[0]?.message?.function_call) {
      const functionCall = parsedResponse.choices[0].message.function_call;
      try {
        parsedResponse = JSON.parse(functionCall.arguments);
      } catch (error) {
        throw new ValidationError('Failed to parse function call arguments', 'FUNCTION_CALL_ERROR');
      }
    }

    if (schema) {
      const formattedResponse = {};
      for (const [key, config] of Object.entries(schema)) {
        const value = parsedResponse[key];
        if (config.required && value === undefined) {
          throw new ValidationError(`Missing required field: ${key}`);
        }
        formattedResponse[key] = value ?? config.defaultValue;
      }
      return formattedResponse;
    }

    return parsedResponse;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Failed to parse response: ${error.message}`);
  }
};

/**
 * Makes an API request with retry and rate limiting capabilities
 * @param {Function} requestFn - The API request function to execute
 * @param {Object} options - Request configuration options
 * @param {Object} [options.rateLimit] - Rate limiting options
 * @param {Object} [options.retry] - Retry operation options
 * @param {Object} [options.responseSchema] - Response formatting schema
 * @returns {Promise<Object>} Formatted API response
 */
export const makeApiRequest = async (requestFn, options = {}) => {
  const limiter = createRateLimiter(options.rateLimit);
  const operation = createRetryOperation(options.retry);

  return new Promise((resolve, reject) => {
    operation.attempt(async (currentAttempt) => {
      try {
        const result = await limiter.schedule(async () => {
          return await requestFn();
        });

        try {
          const formattedResponse = formatResponse(result, options.responseSchema);
          resolve(formattedResponse);
        } catch (transformError) {
          if (transformError instanceof ValidationError) {
            reject(transformError);
          } else {
            reject(new ValidationError(`Response transformation failed: ${transformError.message}`));
          }
        }
      } catch (error) {
        if (error instanceof ApiKeyError || error instanceof ValidationError) {
          reject(error);
        } else {
          handleApiError(error);
        }
      }
    });
  });
};

/**
 * Validates required API parameters
 * @param {Object} params - Parameters to validate
 * @param {string[]} requiredParams - List of required parameter names
 * @returns {boolean} True if validation passes
 * @throws {Error} If required parameters are missing
 */
export const validateParams = (params, requiredParams) => {
  const missingParams = requiredParams.filter(param => !params[param]);
  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }
  return true;
};

/**
 * Validates response data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @throws {ValidationError} If validation fails
 */
export const validateResponseData = (data, schema) => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid response data: Expected an object');
  }

  for (const [key, config] of Object.entries(schema)) {
    const value = data[key];
    
    if (config.required && value === undefined) {
      throw new ValidationError(`Missing required field: ${key}`);
    }
    
    if (value !== undefined && config.type) {
      const valueType = Array.isArray(value) ? 'array' : typeof value;
      if (valueType !== config.type) {
        throw new ValidationError(`Invalid type for ${key}: Expected ${config.type}, got ${valueType}`);
      }
    }
  }
};

/**
 * Validates function call response parameters
 * @param {Object} functionCall - The function call response to validate
 * @param {Object} expectedSchema - Expected parameter schema
 * @returns {boolean} True if validation passes
 * @throws {Error} If validation fails
 */
export const validateFunctionCall = (functionCall, expectedSchema) => {
  if (!functionCall || !functionCall.name || !functionCall.arguments) {
    throw new Error('Invalid function call response format');
  }

  if (functionCall.name !== expectedSchema.name) {
    throw new Error(`Unexpected function name: ${functionCall.name}`);
  }

  try {
    const args = JSON.parse(functionCall.arguments);
    const requiredParams = expectedSchema.parameters.required || [];
    const missingParams = requiredParams.filter(param => !args[param]);

    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters in function response: ${missingParams.join(', ')}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Function call validation failed: ${error.message}`);
  }
};

/**
 * Builds URL query string from parameters
 * @param {Object} params - Parameters to convert to query string
 * @returns {string} Encoded query string
 */
export const buildQueryParams = (params) => {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

