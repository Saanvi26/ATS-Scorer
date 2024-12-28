/**
 * @typedef {Object} OpenAIResponse
 * @property {number} score - Overall match score between 0-100
 * @property {number} matchPercentage - Percentage match for key requirements
 * @property {string[]} keywordMatches - List of matching keywords and skills
 * @property {string[]} missingKeywords - List of missing keywords and skills
 * @property {string[]} suggestions - List of improvement suggestions
 * @property {string} detailedAnalysis - Detailed analysis text
 */

/**
 * @typedef {Object} FeedbackItem
 * @property {string} title - Title of the feedback section
 * @property {string} description - Description or content of the feedback
 */

/**
 * @typedef {Object} ScoreDisplayProps
 * @property {number} score - Score to display (0-100)
 * @property {FeedbackItem[]} feedback - Array of feedback items
 * @property {string[]} suggestions - Array of improvement suggestions
 */

/**
 * @typedef {Object} TransformedResponse
 * @property {number} score - Overall match score between 0-100
 * @property {FeedbackItem[]} feedback - Array of feedback items
 * @property {string[]} suggestions - Array of improvement suggestions
 * @property {number} matchPercentage - Percentage match for requirements
 * @property {string[]} keywordMatches - Matching keywords found
 * @property {string[]} missingKeywords - Missing important keywords
 * @property {string} detailedAnalysis - Detailed analysis text
 */
const validateOpenAIResponse = (response) => {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error(`Invalid response format: Expected object, received ${response === null ? 'null' : Array.isArray(response) ? 'array' : typeof response}`);
  }

  const requiredFields = [
    'score',
    'matchPercentage',
    'keywordMatches',
    'missingKeywords',
    'suggestions',
    'detailedAnalysis'
  ];

  for (const field of requiredFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}. Received fields: ${Object.keys(response).join(', ')}`);
    }
  }

  // Validate numeric fields
  const numericFields = [
    { name: 'matchPercentage', value: response.matchPercentage },
    { name: 'score', value: response.score }
  ];

  for (const field of numericFields) {
    if (typeof field.value !== 'number' || isNaN(field.value)) {
      throw new Error(`Invalid ${field.name}: Expected number, received ${typeof field.value}. Value: ${field.value}`);
    }
    if (field.value < 0 || field.value > 100) {
      throw new Error(`Invalid ${field.name}: Must be between 0 and 100. Received: ${field.value}`);
    }
  }

  // Validate array fields
  const arrayFields = [
    { name: 'keywordMatches', value: response.keywordMatches },
    { name: 'missingKeywords', value: response.missingKeywords },
    { name: 'suggestions', value: response.suggestions }
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(field.value)) {
      throw new Error(`Invalid ${field.name}: Expected array, received ${typeof field.value}`);
    }
    if (field.value.some(item => typeof item !== 'string' || !item.trim())) {
      throw new Error(`Invalid ${field.name}: All items must be non-empty strings`);
    }
  }

  // Validate detailed analysis
  if (typeof response.detailedAnalysis !== 'string' || !response.detailedAnalysis.trim()) {
    throw new Error(`Invalid detailedAnalysis: Expected non-empty string, received ${typeof response.detailedAnalysis}`);
  }
};

const parseDetailedAnalysis = (analysis) => {
  if (typeof analysis !== 'string') {
    throw new Error(`Invalid analysis format: Expected string, received ${typeof analysis}`);
  }

  if (!analysis.trim()) {
    throw new Error('Empty analysis text provided');
  }

  const paragraphs = analysis
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    throw new Error('No valid paragraphs found in analysis text');
  }

  return paragraphs.map((paragraph, index) => ({
    title: `Analysis Part ${index + 1}`,
    description: paragraph
  }));
};

/**
 * Transforms OpenAI response format to include ScoreDisplay props and additional analysis data
 * @param {OpenAIResponse} response - Response from OpenAI analysis
 * @returns {TransformedResponse} Formatted response with all analysis fields
 * @throws {Error} If response format is invalid or required fields are missing
 */
const transformOpenAIResponse = (response) => {
  try {
    validateOpenAIResponse(response);

    const feedback = [
      // Add matching skills feedback
      {
        title: 'Matching Skills',
        description: response.keywordMatches.join(', ')
      },
      // Add missing skills feedback
      {
        title: 'Missing Skills',
        description: response.missingKeywords.join(', ')
      },
      // Add detailed analysis feedback items
      ...parseDetailedAnalysis(response.detailedAnalysis)
    ];

    return {
      score: response.score,
      feedback,
      suggestions: response.suggestions,
      matchPercentage: response.matchPercentage,
      keywordMatches: response.keywordMatches,
      missingKeywords: response.missingKeywords,
      detailedAnalysis: response.detailedAnalysis
    };
  } catch (error) {
    throw new Error(`Failed to transform OpenAI response: ${error.message}`);
  }
};

export { transformOpenAIResponse };