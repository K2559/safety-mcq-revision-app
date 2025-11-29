import React from 'react';
import { Question, Option } from '../types';

interface QuizCardProps {
  question: Question;
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
  showFeedback: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ question, selectedOption, onSelectOption, showFeedback }) => {
  
  const getOptionClass = (option: Option) => {
    const baseClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 mb-3 flex items-start";
    
    if (showFeedback) {
      if (option.id === question.correctAnswer) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800 font-medium`;
      }
      if (selectedOption === option.id && option.id !== question.correctAnswer) {
        return `${baseClass} bg-red-100 border-red-500 text-red-800`;
      }
      return `${baseClass} border-gray-200 opacity-60`;
    }

    if (selectedOption === option.id) {
      return `${baseClass} bg-blue-50 border-blue-500 text-blue-800`;
    }

    return `${baseClass} border-gray-200 hover:border-blue-300 hover:bg-gray-50`;
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 md:p-8 max-w-3xl w-full mx-auto">
      <div className="mb-6">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question {question.id}</span>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-2 leading-relaxed">
          {question.questionText}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => !showFeedback && onSelectOption(option.id)}
            disabled={showFeedback}
            className={getOptionClass(option)}
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-sm font-bold mr-4 shrink-0 uppercase text-gray-600">
              {option.id}
            </span>
            <span className="mt-1">{option.text}</span>
          </button>
        ))}
      </div>

      {showFeedback && (
        <div className={`mt-6 p-4 rounded-lg ${selectedOption === question.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <p className="font-bold flex items-center">
            {selectedOption === question.correctAnswer ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Correct!
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Incorrect. The correct answer is {question.correctAnswer.toUpperCase()}.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizCard;