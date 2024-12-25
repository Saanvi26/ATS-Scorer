import React from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorMessage>Something went wrong displaying the score.</ErrorMessage>
          <ErrorDetail>{this.state.error.message}</ErrorDetail>
        </ErrorContainer>
      );
    }
    return this.props.children;
  }
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateY(20px); }
  to { transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-in;
`;

const ScoreCircle = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 50%;
  background: ${props => `conic-gradient(
    var(--primary-color) ${props.score}%,
    var(--background-secondary) ${props.score}% 100%
  )`};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.8s ease-in-out;
`;

const ScoreText = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--text-primary);
`;

const Section = styled.div`
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--background-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  animation: ${slideIn} 0.5s ease-out;
  color: var(--text-primary);
  
  & h2 {
    color: var(--text-primary);
    margin-bottom: 1rem;
  }
`;

const FeedbackItem = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  border-left: 4px solid var(--primary-color);
  background: var(--background-secondary);
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
  
  & h3 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  &:hover {
    background: var(--background-hover);
  }
`;

const SuggestionList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const SuggestionItem = styled.li`
  margin: 0.8rem 0;
  padding: 0.8rem;
  background: var(--background-secondary);
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  text-align: left;
  color: var(--text-primary);
  
  &:hover {
    background: var(--background-hover);
  }
  
  &:before {
    content: "→";
    margin-right: 10px;
    color: var(--primary-color);
  }
`;

const KeywordSection = styled(Section)`
  margin-top: 1.5rem;
`;

const KeywordList = styled(SuggestionList)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const KeywordItem = styled(SuggestionItem)`
  margin: 0;
  background: ${props => props.missing ? 'var(--background-error)' : 'var(--background-secondary)'};
  border: 1px solid ${props => props.missing ? 'var(--border-error)' : 'transparent'};
  
  &:before {
    content: "${props => props.missing ? '✗' : '✓'}";
    color: ${props => props.missing ? '#ff0000' : '#38a169'};
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  margin: 1rem;
  background: #fff5f5;
  border-radius: 8px;
  border: 1px solid #feb2b2;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.h3`
  color: #c53030;
  margin-bottom: 0.5rem;
`;

const ErrorDetail = styled.p`
  color: #4a1818;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingSkeleton = styled.div`
  height: ${props => props.height || '20px'};
  background: linear-gradient(90deg, 
    var(--background-secondary) 25%, 
    var(--background-hover) 50%, 
    var(--background-secondary) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const ScoreDisplay = ({
  score,
  feedback,
  suggestions,
  matchPercentage,
  keywordMatches,
  missingKeywords,
  detailedAnalysis,
  isLoading
}) => {


  // console.log("All values:", score, feedback, suggestions, matchPercentage, keywordMatches, missingKeywords, detailedAnalysis, isLoading);


  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSkeleton height="200px" style={{ borderRadius: '50%' }} />
        <LoadingSkeleton height="100px" />
        <LoadingSkeleton height="150px" />
      </LoadingContainer>
    );
  }

  return (
    <ErrorBoundary>
      <Container>
        {score < 0 || score > 100 ? (
          <ErrorContainer>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorMessage>Invalid score value</ErrorMessage>
            <ErrorDetail>Score must be between 0 and 100</ErrorDetail>
          </ErrorContainer>
        ) : (
          <>
            <ScoreCircle score={score}>
              <ScoreText>{score}%</ScoreText>
            </ScoreCircle>

            <Section>
              <h2> Detailed Analysis</h2>
              <p>{detailedAnalysis}</p>
            </Section>

            <Section>
              <h2> Feedback</h2>
              {feedback.map((item, index) => (
                <FeedbackItem key={index}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </FeedbackItem>
              ))}
            </Section>

            <KeywordSection>
              <h2>Keyword Matches</h2>
              <KeywordList>
                {keywordMatches.map((keyword, index) => (
                  <KeywordItem key={index}>{keyword}</KeywordItem>
                ))}
              </KeywordList>
            </KeywordSection>

            <KeywordSection>
              <h2>Missing Keywords</h2>
              <KeywordList>
                {missingKeywords.map((keyword, index) => (
                  <KeywordItem key={index} missing>{keyword}</KeywordItem>
                ))}
              </KeywordList>
            </KeywordSection>

            <Section>
              <h2>Suggestions for Improvement</h2>
              <SuggestionList>
                {suggestions.map((suggestion, index) => (
                  <SuggestionItem key={index}>{suggestion}</SuggestionItem>
                ))}
              </SuggestionList>
            </Section>
          </>
        )}
      </Container>
    </ErrorBoundary>
  );
};

ScoreDisplay.propTypes = {
  score: PropTypes.number.isRequired,
  matchPercentage: PropTypes.number.isRequired,
  feedback: PropTypes.arrayOf(
    PropTypes.exact({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired
    })
  ),
  suggestions: PropTypes.arrayOf(PropTypes.string.isRequired),
  keywordMatches: PropTypes.arrayOf(PropTypes.string.isRequired),
  missingKeywords: PropTypes.arrayOf(PropTypes.string.isRequired),
  detailedAnalysis: PropTypes.string.isRequired,
  isLoading: PropTypes.bool
};

ScoreDisplay.defaultProps = {
  isLoading: false,
  feedback: [],
  suggestions: [],
  keywordMatches: [],
  missingKeywords: [],
  detailedAnalysis: '',
  matchPercentage: 0
};

export default ScoreDisplay;