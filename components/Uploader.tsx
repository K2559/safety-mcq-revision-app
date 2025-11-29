import React, { useState, useRef } from 'react';
import { DEFAULT_DATA, parseQuestions } from '../utils';
import { Question } from '../types';

interface UploaderProps {
  onQuestionsLoaded: (questions: Question[], isRandom: boolean) => void;
}

const Uploader: React.FC<UploaderProps> = ({ onQuestionsLoaded }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRandom, setIsRandom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = (content: string) => {
    try {
      const questions = parseQuestions(content);
      if (questions.length === 0) {
        setError('No valid questions found. Please check the format.');
        return;
      }
      onQuestionsLoaded(questions, isRandom);
    } catch (e) {
      setError('Error parsing text. Please ensure format is correct.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    setText(DEFAULT_DATA);
    // Don't auto parse on load sample, let user choose options
    const questions = parseQuestions(DEFAULT_DATA);
    onQuestionsLoaded(questions, isRandom);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Safety MCQ Revision</h1>
          <p className="text-gray-500">Upload your question file or paste text to start.</p>
        </div>

        <div 
          className="border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            className="hidden"
          />
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="text-lg font-medium text-gray-700">Click to upload .txt file</p>
          <p className="text-sm text-gray-400 mt-2">Format: Question ID, Options (a. b. c.), Answer (答案: a)</p>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or paste text</span>
          </div>
        </div>

        <textarea
          className="w-full h-48 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4 text-sm font-mono"
          placeholder="Paste your questions here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <div className="flex items-center mb-6">
          <input
            id="random-mode"
            type="checkbox"
            checked={isRandom}
            onChange={(e) => setIsRandom(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="random-mode" className="ml-2 text-sm font-medium text-gray-900">
            Randomize Question Order
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleParse(text)}
            disabled={!text.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Quiz
          </button>
          <button
            onClick={loadSample}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Load Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Uploader;