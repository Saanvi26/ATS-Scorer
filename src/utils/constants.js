// Feedback Section Titles
export const FEEDBACK_TITLES = {
  MATCHING_SKILLS: 'Matching Skills',
  MISSING_SKILLS: 'Missing Skills',
  ANALYSIS: 'Analysis',
  DETAILED_FEEDBACK: 'Detailed Feedback',
  SUGGESTIONS: 'Suggestions for Improvement'
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_RESPONSE: 'Invalid response format: Response must be an object',
  MISSING_FIELD: (field) => `Missing required field: ${field}`,
  INVALID_MATCH_PERCENTAGE: 'Invalid matchPercentage: Must be a number between 0 and 100',
  INVALID_ARRAYS: 'Invalid array fields: keywordMatches, missingKeywords, and suggestions must be arrays',
  INVALID_ANALYSIS: 'Invalid detailedAnalysis: Must be a string',
  TRANSFORM_ERROR: (message) => `Failed to transform OpenAI response: ${message}`
};

// Default Values
export const DEFAULTS = {
  SCORE: 0,
  IS_LOADING: false,
  EMPTY_ARRAY: [],
  EMPTY_STRING: '',
  FEEDBACK_TITLE: 'General Feedback'
};

// Length Limits
export const LENGTH_LIMITS = {
  MAX_FEEDBACK_ITEMS: 10,
  MAX_SUGGESTIONS: 5,
  MAX_KEYWORDS: 20,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_SUGGESTION_LENGTH: 200
};

// Score Ranges
export const SCORE_RANGES = {
  MIN: 0,
  MAX: 100,
  POOR: 30,
  FAIR: 50,
  GOOD: 70,
  EXCELLENT: 90
};