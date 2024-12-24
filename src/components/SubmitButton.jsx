import React from 'react';
import { FiLoader } from 'react-icons/fi';

const SubmitButton = ({ 
  onClick, 
  isLoading, 
  disabled, 
  error, 
  children 
}) => {
  const baseClasses = "w-full max-w-md mx-auto mt-4 px-4 py-2 rounded font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const getButtonClasses = () => {
    if (disabled || isLoading) {
      return `${baseClasses} bg-gray-400 text-white cursor-not-allowed`;
    }
    if (error) {
      return `${baseClasses} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
    }
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={getButtonClasses()}
        type="button"
      >
        <div className="flex items-center justify-center">
          {isLoading && (
            <FiLoader className="animate-spin mr-2" />
          )}
          <span>{isLoading ? 'Processing...' : children}</span>
        </div>
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
};

export default SubmitButton;