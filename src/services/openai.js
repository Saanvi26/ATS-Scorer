import OpenAI from 'openai';
import { makeApiRequest, formatResponse } from '../utils/apiHelpers.js';
import { transformOpenAIResponse } from '../utils/transformers.js';
import { getApiKey, ApiKeyError } from '../utils/apiKeyUtils.js';
import { validateModel, getModel, ModelError } from '../utils/modelUtils.js';

let cachedClient = null;

const getOpenAIClient = () => {
  const apiKey = getApiKey();
  const model = getModel();

  if (!apiKey) {
    throw new ApiKeyError('OpenAI API key not found. Please set your API key in settings.');
  }

  try {
    validateModel(model);
  } catch (error) {
    throw new ModelError('Invalid model configuration. Please check your model settings.');
  }

  if (!cachedClient || cachedClient.apiKey !== apiKey) {
    cachedClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  return { client: cachedClient, model };
};

// Listen for storage changes to reinitialize client when API key changes
window.addEventListener('storage', (event) => {
  if (event.key === 'openai_api_key') {
    cachedClient = null; // Force client reinitialization
  }
});

/**
 * Analyzes a resume against a job description using OpenAI's GPT model
 * @param {string} resumeText - The text content of the resume
 * @param {string} jobDescription - The job description to match against
 * @returns {Promise<import('../utils/transformers.js').ScoreDisplayProps>} Transformed analysis results for display
 */
const analyzeResumeTool = {
  type: 'function',
  function: {
    name: 'analyze_resume',
    description: 'Analyzes a resume against a job description to provide matching analysis and recommendations',
    parameters: {
    type: 'object',
    properties: {
      score: {
        type: 'number',
        description: 'Overall match score between 0-100'
      },
      matchPercentage: {
        type: 'number',
        description: 'Percentage match for key requirements'
      },
      keywordMatches: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of matching keywords and skills found'
      },
      missingKeywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of important missing keywords and skills'
      },
      suggestions: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of specific suggestions for improvement'
      },
      detailedAnalysis: {
        type: 'string',
        description: 'Detailed analysis of qualifications and match'
      }
    },
    required: ['score', 'matchPercentage', 'keywordMatches', 'missingKeywords', 'suggestions', 'detailedAnalysis']
    }
  }
};

const analyzeResumeAgainstJob = async (resumeText, jobDescription) => {
  const responseSchema = {
    score: { type: 'number', required: true },
    matchPercentage: { type: 'number', required: true },
    keywordMatches: { type: 'array', required: true },
    missingKeywords: { type: 'array', required: true },
    suggestions: { type: 'array', required: true },
    detailedAnalysis: { type: 'string', required: true },
    feedback: { type: 'array', required: true }
  };

  const requestFn = async () => {
    let response;
    try {
      const { client, model } = getOpenAIClient();
      response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert ATS system analyzing resume matches against job descriptions. You must always return some value for the tool call for each field.",
          },
          {
            role: "user",
            content: `Analyze this resume against the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`,
          },
        ],
        tools: [analyzeResumeTool],
        temperature: 0.5,
        max_tokens: 2000,
      });
    } catch (error) {
      // Handle specific error types first
      if (error instanceof ModelError || error instanceof ApiKeyError) {
        throw error;
      }
      
      // Handle specific API error status codes
      if (error?.status === 401) {
        throw new ApiKeyError('Your OpenAI API key appears to be invalid or has expired. Please verify your API key in settings and try again.', 'AUTHENTICATION_ERROR');
      } 
      if (error?.status === 429) {
        throw new ApiKeyError('You have exceeded the API rate limit. Please wait a moment and try again.', 'RATE_LIMIT_ERROR');
      }
      
      // Handle network connectivity errors
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        throw new ApiKeyError('Unable to connect to OpenAI servers. Please check your internet connection.', 'NETWORK_ERROR');
      }
      
      // Handle other API errors with more specific message
      throw new ApiKeyError(`OpenAI API error: ${error.message || 'Unknown error occurred'}`, 'API_ERROR');
    }
    // Log raw response for debugging
    console.log('Raw OpenAI Response:', JSON.stringify(response, null, 2));

    // Validate response structure
    if (!response?.choices?.[0]?.message?.tool_calls?.[0]) {
      throw new Error('Invalid OpenAI response structure: Missing required tool calls');
    }

    const toolCall = response.choices[0].message.tool_calls[0];
    
    // Log processed response data
    console.log('Processed OpenAI Response:', {
      model: response.model,
      toolCall: JSON.stringify(toolCall, null, 2),
      usage: response.usage
    });
    
    if (!toolCall.function?.name || toolCall.function.name !== 'analyze_resume') {
      throw new Error(`Invalid tool call response: Expected 'analyze_resume' but got '${toolCall.function?.name}'`);
    }

    try {
      if (!toolCall.function?.arguments) {
        throw new Error('Missing function arguments in tool call');
      }

      const openAIResponse = JSON.parse(toolCall.function.arguments);
      
      // Validate response has all required fields before transformation
      const requiredFields = ['score', 'matchPercentage', 'keywordMatches', 'missingKeywords', 'suggestions', 'detailedAnalysis'];
      const missingFields = requiredFields.filter(field => !(field in openAIResponse));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields in OpenAI response: ${missingFields.join(', ')}`);
      }

      return transformOpenAIResponse(openAIResponse);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse OpenAI response arguments: ${error.message}\nResponse: ${toolCall?.function?.arguments}`);
      }
      throw new Error(`Failed to process OpenAI response: ${error.message}`);
    }
  };
  return makeApiRequest(requestFn, {
    responseSchema,
    rateLimit: {
      maxConcurrent: 5,
      minTime: 200
    },
    retry: {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000
    }
  });

};

export { analyzeResumeAgainstJob };
