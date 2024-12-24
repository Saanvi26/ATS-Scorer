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
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format: Response must be an object');
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
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof response.matchPercentage !== 'number' || 
      response.matchPercentage < 0 || 
      response.matchPercentage > 100) {
    throw new Error('Invalid matchPercentage: Must be a number between 0 and 100');
  }

  if (typeof response.score !== 'number' || 
      response.score < 0 || 
      response.score > 100) {
    throw new Error('Invalid score: Must be a number between 0 and 100');
  }

  if (!Array.isArray(response.keywordMatches) || 
      !Array.isArray(response.missingKeywords) || 
      !Array.isArray(response.suggestions)) {
    throw new Error('Invalid array fields: keywordMatches, missingKeywords, and suggestions must be arrays');
  }

  if (typeof response.detailedAnalysis !== 'string') {
    throw new Error('Invalid detailedAnalysis: Must be a string');
  }
};

const parseDetailedAnalysis = (analysis) => {
  // Split analysis into paragraphs and convert each into a feedback item
  return analysis
    .split('\n\n')
    .filter(paragraph => paragraph.trim())
    .map(paragraph => ({
      title: 'Analysis',
      description: paragraph.trim()
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