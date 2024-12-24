import { transformOpenAIResponse } from '../transformers';

// Mock valid OpenAI response
const mockValidResponse = {
  score: 85,
  matchPercentage: 85,
  keywordMatches: ['React', 'JavaScript', 'Node.js'],
  missingKeywords: ['Python', 'AWS'],
  suggestions: ['Add more cloud experience', 'Include Python projects'],
  detailedAnalysis: 'Strong frontend skills.\n\nNeeds cloud experience.'
};

describe('transformOpenAIResponse', () => {
  // Successful transformation tests
  describe('successful transformations', () => {
    it('should transform valid OpenAI response correctly', () => {
      const result = transformOpenAIResponse(mockValidResponse);
      
      expect(result).toEqual({
        score: 85,
        feedback: [
          {
            title: 'Matching Skills',
            description: 'React, JavaScript, Node.js'
          },
          {
            title: 'Missing Skills',
            description: 'Python, AWS'
          },
          {
            title: 'Analysis',
            description: 'Strong frontend skills.'
          },
          {
            title: 'Analysis',
            description: 'Needs cloud experience.'
          }
        ],
        suggestions: ['Add more cloud experience', 'Include Python projects']
      });
    });

    it('should match ScoreDisplay PropTypes requirements', () => {
      const result = transformOpenAIResponse(mockValidResponse);
      
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.feedback)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      
      result.feedback.forEach(item => {
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('description');
        expect(typeof item.title).toBe('string');
        expect(typeof item.description).toBe('string');
      });
      
      result.suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
      });
    });
  });

  // Error handling tests
  describe('error handling', () => {
    it('should throw error for null response', () => {
      expect(() => transformOpenAIResponse(null))
        .toThrow('Failed to transform OpenAI response: Invalid response format: Response must be an object');
    });

    it('should throw error for missing required fields', () => {
      const invalidResponse = {
        matchPercentage: 85,
        keywordMatches: ['React']
        // Missing other required fields
      };
      
      expect(() => transformOpenAIResponse(invalidResponse))
        .toThrow('Failed to transform OpenAI response: Missing required field:');
    });

    it('should throw error for invalid matchPercentage', () => {
      const invalidResponse = {
        ...mockValidResponse,
        matchPercentage: 150 // Invalid percentage
      };
      
      expect(() => transformOpenAIResponse(invalidResponse))
        .toThrow('Failed to transform OpenAI response: Invalid matchPercentage: Must be a number between 0 and 100');
    });

    it('should throw error for non-array fields', () => {
      const invalidResponse = {
        ...mockValidResponse,
        keywordMatches: 'not an array'
      };
      
      expect(() => transformOpenAIResponse(invalidResponse))
        .toThrow('Failed to transform OpenAI response: Invalid array fields');
    });
  });

  // Edge cases tests
  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const responseWithEmpty = {
        ...mockValidResponse,
        keywordMatches: [],
        missingKeywords: [],
        suggestions: []
      };
      
      const result = transformOpenAIResponse(responseWithEmpty);
      
      expect(result.feedback[0].description).toBe('');
      expect(result.feedback[1].description).toBe('');
      expect(result.suggestions).toEqual([]);
    });

    it('should handle single-line detailed analysis', () => {
      const responseWithSingleLine = {
        ...mockValidResponse,
        detailedAnalysis: 'Single line analysis.'
      };
      
      const result = transformOpenAIResponse(responseWithSingleLine);
      
      expect(result.feedback).toHaveLength(3); // 2 default + 1 analysis
      expect(result.feedback[2].description).toBe('Single line analysis.');
    });
  });

  // Snapshot tests
  describe('snapshot tests', () => {
    it('should maintain consistent output format', () => {
      const result = transformOpenAIResponse(mockValidResponse);
      expect(result).toMatchSnapshot();
    });

    it('should maintain consistent format with minimal data', () => {
      const minimalResponse = {
        matchPercentage: 0,
        keywordMatches: [],
        missingKeywords: [],
        suggestions: [],
        detailedAnalysis: ''
      };
      
      const result = transformOpenAIResponse(minimalResponse);
      expect(result).toMatchSnapshot();
    });
  });
});