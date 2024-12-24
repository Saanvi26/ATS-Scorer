import OpenAI from 'openai';
import { makeApiRequest, formatResponse } from '../utils/apiHelpers.js';
import { transformOpenAIResponse } from '../utils/transformers.js';

const openai = new OpenAI({
  apiKey: "apiKey",
  dangerouslyAllowBrowser: true
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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS system analyzing resume matches against job descriptions. You must always return some value for the tool call for each field."
        },
        {
          role: "user",
          content: `Analyze this resume against the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`
        }
      ],
      tools: [analyzeResumeTool],
      temperature: 0.5,
      max_tokens: 2000
    });

    if (!response.choices?.[0]?.message?.tool_calls?.[0]) {
      throw new Error('Invalid OpenAI response: Missing tool calls');
    }

    const toolCall = response.choices[0].message.tool_calls[0];
    
    console.log('OpenAI Response:', {
      model: response.model,
      toolCall: toolCall,
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
