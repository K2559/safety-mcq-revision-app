import React from 'react';
import { Question } from '../types';

interface QuestionMapProps {
  questions: Question[];
  userAnswers: { [key: string]: string };
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QuestionMap: React.FC<QuestionMapProps> = ({ questions, userAnswers, onSelectQuestion, onClose, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Question Overview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex gap-6 mb-6 justify-center text-sm font-medium sticky top-0 bg-white pb-2 pt-2 border-b">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
              <span>Correct</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded mr-2"></div>
              <span>Incorrect</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {questions.map((q, index) => {
              const answer = userAnswers[q.id];
              let className = "aspect-square flex items-center justify-center rounded-lg border-2 text-sm font-bold transition-all duration-200 hover:shadow-md";
              
              if (!answer) {
                // Unanswered: Gray
                className += " bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600";
              } else if (answer === q.correctAnswer) {
                // Correct: Green
                className += " bg-green-50 border-green-500 text-green-700";
              } else {
                // Incorrect: Red
                className += " bg-red-50 border-red-500 text-red-700";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    onSelectQuestion(index);
                    onClose();
                  }}
                  className={className}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionMap;