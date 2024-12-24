import { resumeAnalysisInputSchema, resumeAnalysisResponseSchema, analyzeResumeFunction } from '../schemas/openai.js';
import { validateParams, validateFunctionCall } from '../utils/apiHelpers.js';

/**
 * Validates resume analysis input parameters
 * @param {Object} input - Input parameters to validate
 * @param {string} input.resumeText - Resume text content
 * @param {string} input.jobDescription - Job description text
 * @returns {boolean} True if validation passes
 * @throws {Error} If validation fails
 */
export const validateResumeInput = (input) => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: Expected object with resumeText and jobDescription');
  }

  const { resumeText, jobDescription } = input;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
    throw new Error('Invalid resumeText: Must be a non-empty string');
  }

  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    throw new Error('Invalid jobDescription: Must be a non-empty string');
  }

  return validateParams(input, resumeAnalysisInputSchema.required);
};

/**
 * Validates OpenAI function parameters against schema
 * @param {Object} params - Function parameters to validate
 * @param {Object} schema - Parameter schema to validate against
 * @returns {boolean} True if validation passes
 * @throws {Error} If validation fails
 */
export const validateFunctionParameters = (params, schema) => {
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters: Expected object');
  }

  if (!schema || !schema.properties) {
    throw new Error('Invalid schema: Missing properties definition');
  }

  const { properties, required = [] } = schema;

  // Validate required parameters
  validateParams(params, required);

  // Validate parameter types and constraints
  Object.entries(params).forEach(([key, value]) => {
    const propertySchema = properties[key];
    if (!propertySchema) {
      throw new Error(`Unexpected parameter: ${key}`);
    }

    if (propertySchema.type === 'string') {
      if (typeof value !== 'string') {
        throw new Error(`Invalid ${key}: Must be a string`);
      }
      if (propertySchema.minLength && value.length < propertySchema.minLength) {
        throw new Error(`Invalid ${key}: Must be at least ${propertySchema.minLength} characters`);
      }
    }

    if (propertySchema.type === 'number') {
      if (typeof value !== 'number') {
        throw new Error(`Invalid ${key}: Must be a number`);
      }
      if (propertySchema.minimum !== undefined && value < propertySchema.minimum) {
        throw new Error(`Invalid ${key}: Must be >= ${propertySchema.minimum}`);
      }
      if (propertySchema.maximum !== undefined && value > propertySchema.maximum) {
        throw new Error(`Invalid ${key}: Must be <= ${propertySchema.maximum}`);
      }
    }

    if (propertySchema.type === 'array') {
      if (!Array.isArray(value)) {
        throw new Error(`Invalid ${key}: Must be an array`);
      }
      if (propertySchema.items) {
        value.forEach((item, index) => {
          if (propertySchema.items.type === 'string' && typeof item !== 'string') {
            throw new Error(`Invalid ${key}[${index}]: Must be a string`);
          }
          if (propertySchema.items.minLength && item.length < propertySchema.items.minLength) {
            throw new Error(`Invalid ${key}[${index}]: Must be at least ${propertySchema.items.minLength} characters`);
          }
        });
      }
    }
  });

  return true;
};

/**
 * Validates resume analysis response from OpenAI
 * @param {Object} response - Analysis response to validate
 * @returns {boolean} True if validation passes
 * @throws {Error} If validation fails
 */
export const validateAnalysisResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response: Expected object');
  }

  // Validate function call format and name
  validateFunctionCall(
    { 
      name: 'analyze_resume',
      arguments: JSON.stringify(response)
    },
    analyzeResumeFunction
  );

  // Validate response parameters
  validateFunctionParameters(response, analyzeResumeFunction.parameters);

  // Validate response schema
  const missingFields = Object.keys(resumeAnalysisResponseSchema)
    .filter(key => !response.hasOwnProperty(key));

  if (missingFields.length > 0) {
    throw new Error(`Missing required response fields: ${missingFields.join(', ')}`);
  }

  return true;
};