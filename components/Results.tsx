import React from 'react';
import { QuizResult } from '../types';

interface ResultsProps {
  result: QuizResult;
  onRetry: () => void;
  onHome: () => void;
}

const Results: React.FC<ResultsProps> = ({ result, onRetry, onHome }) => {
  const percentage = Math.round((result.correct / result.total) * 100) || 0;
  
  return (
    <div className="max-w-2xl mx-auto text-center pt-8 pb-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
        <p className="text-gray-500 mb-8">Here is how you performed</p>

        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={percentage >= 70 ? "#10B981" : percentage >= 40 ? "#F59E0B" : "#EF4444"}
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              className="animate-[spin_1s_ease-out_reverse]"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="text-2xl font-bold text-gray-800">{result.total}</div>
            <div className="text-xs text-gray-500 uppercase font-semibold">Questions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{result.correct}</div>
            <div className="text-xs text-green-600 uppercase font-semibold">Correct</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl">
            <div className="text-2xl font-bold text-red-600">{result.wrong}</div>
            <div className="text-xs text-red-600 uppercase font-semibold">Wrong</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200"
          >
            Retry Quiz
          </button>
          <button
            onClick={onHome}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Upload New File
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;