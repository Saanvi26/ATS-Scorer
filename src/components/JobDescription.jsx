import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const TextAreaWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 2rem;
`;

const StyledTextArea = styled.textarea`
  min-height: 150px;
  max-height: 300px;
  padding: 12px;
  border: 2px solid ${props => props.hasError ? '#ff4d4f' : '#d9d9d9'};
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  transition: all 0.3s;
  overflow-y: auto;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ff4d4f' : '#1890ff'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(255, 77, 79, 0.2)' : 'rgba(24, 144, 255, 0.2)'};
  }

  &::placeholder {
    color: #bfbfbf;
  }
`;

const HelperText = styled.div`
  font-size: 12px;
  color: ${props => props.hasError ? '#ff4d4f' : '#8c8c8c'};
  display: flex;
  justify-content: space-between;
`;

const CharacterCount = styled.span`
  color: ${props => props.isNearLimit ? '#faad14' : '#8c8c8c'};
`;

const JobDescription = ({ 
  value, 
  onChange, 
  minLength = 100,
  maxLength = 5000,
  error,
  setError
}) => {
  const textareaRef = useRef(null);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    const text = e.target.value;
    setCharCount(text.length);
    
    if (text.length < minLength) {
      setError(`Please enter at least ${minLength} characters`);
    } else {
      setError('');
    }
    
    onChange(text);
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '150px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <TextAreaWrapper>
      <StyledTextArea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder="Enter the job description here. Include key responsibilities, requirements, and qualifications for the position."
        maxLength={maxLength}
        hasError={!!error}
        aria-label="Job Description"
        aria-invalid={!!error}
        aria-describedby="job-description-helper-text"
      />
      <HelperText 
        id="job-description-helper-text"
        hasError={!!error}
      >
        <span>{error || 'Enter a detailed job description'}</span>
        <CharacterCount isNearLimit={charCount > maxLength * 0.9}>
          {charCount}/{maxLength}
        </CharacterCount>
      </HelperText>
    </TextAreaWrapper>
  );
};

export default JobDescription;