import React, { useState, useEffect, useRef } from 'react';
import { AppState, Question, QuizResult } from './types';
import Uploader from './components/Uploader';
import QuizCard from './components/QuizCard';
import Results from './components/Results';
import QuestionMap from './components/QuestionMap';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.QUIZ);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Navigation State
  const [history, setHistory] = useState<number[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQuestionIndex = history[historyIndex] ?? 0;

  // Load questions from fixed file path on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Use import.meta.env.BASE_URL to get the correct base path for GitHub Pages
        const basePath = import.meta.env.BASE_URL || '/';
        const questionPath = `${basePath}Question/Safety%20Quiz%20Question%202022.txt`;
        const response = await fetch(questionPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.status}`);
        }
        
        const text = await response.text();
        const { parseQuestions } = await import('./utils');
        const parsedQuestions = parseQuestions(text);
        
        if (parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          setHistory([0]);
          setHistoryIndex(0);
          setUserAnswers({});
          setIsAnswerRevealed(false);
          setShowMap(false);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuestions();
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state]);

  // Auto-scroll the preview list when current question changes
  useEffect(() => {
    if (scrollRef.current && questions.length > 0) {
      const button = scrollRef.current.children[currentQuestionIndex] as HTMLElement;
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentQuestionIndex, questions.length]);

  const handleQuestionsLoaded = (parsedQuestions: Question[], isRandom: boolean) => {
    setQuestions(parsedQuestions);
    setIsRandomMode(isRandom);
    
    // Determine start index
    let startIndex = 0;
    if (isRandom && parsedQuestions.length > 0) {
      startIndex = Math.floor(Math.random() * parsedQuestions.length);
    }
    
    setHistory([startIndex]);
    setHistoryIndex(0);
    setUserAnswers({});
    setIsAnswerRevealed(false);
    setShowMap(false);
    setState(AppState.QUIZ);
  };

  const updateRevealState = (questionIndex: number) => {
    const questionId = questions[questionIndex].id;
    setIsAnswerRevealed(!!userAnswers[questionId]);
  };

  const handleOptionSelect = (optionId: string) => {
    const question = questions[currentQuestionIndex];
    setUserAnswers(prev => ({ ...prev, [question.id]: optionId }));
    setIsAnswerRevealed(true);
  };

  const toggleRandomMode = () => {
    setIsRandomMode(prev => !prev);
  };

  const handleNext = () => {
    // 1. Move forward in history if available
    if (historyIndex < history.length - 1) {
      const nextHistIdx = historyIndex + 1;
      setHistoryIndex(nextHistIdx);
      updateRevealState(history[nextHistIdx]);
      window.scrollTo(0, 0);
      return;
    }

    // 2. Generate new step
    const visitedSet = new Set(history);
    let nextIndex = -1;

    if (isRandomMode) {
      // Find unvisited questions
      const unvisited = questions
        .map((_, idx) => idx)
        .filter(idx => !visitedSet.has(idx));
      
      if (unvisited.length === 0) {
        finishQuiz();
        return;
      }
      const randomIdx = Math.floor(Math.random() * unvisited.length);
      nextIndex = unvisited[randomIdx];
    } else {
      // Sequential
      if (currentQuestionIndex >= questions.length - 1) {
        finishQuiz();
        return;
      }
      nextIndex = currentQuestionIndex + 1;
    }

    const newHistory = [...history, nextIndex];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIsAnswerRevealed(false);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    if (historyIndex > 0) {
      const prevHistIdx = historyIndex - 1;
      setHistoryIndex(prevHistIdx);
      updateRevealState(history[prevHistIdx]);
      window.scrollTo(0, 0);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    // Discard forward history if jumping from middle of stack
    const newHistory = [...history.slice(0, historyIndex + 1), index];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    updateRevealState(index);
    window.scrollTo(0, 0);
  };

  const finishQuiz = () => {
    setState(AppState.RESULT);
  };

  const calculateResults = (): QuizResult => {
    let correct = 0;
    const historyData = questions.map(q => {
      const userSelected = userAnswers[q.id];
      const isCorrect = userSelected === q.correctAnswer;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        userSelected,
        isCorrect
      };
    });

    return {
      total: questions.length,
      correct,
      wrong: questions.length - correct,
      history: historyData
    };
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        </div>
      );
    }

    switch (state) {
      case AppState.UPLOAD:
        return <Uploader onQuestionsLoaded={handleQuestionsLoaded} />;

      case AppState.QUIZ:
        if (questions.length === 0) return null;
        const currentQ = questions[currentQuestionIndex];
        
        // Determine if this is the last question (for button text)
        const visitedSet = new Set(history);
        const isLastQuestion = isRandomMode 
          ? visitedSet.size === questions.length && historyIndex === history.length - 1
          : currentQuestionIndex === questions.length - 1 && historyIndex === history.length - 1;

        return (
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col min-h-screen relative">
            
            {/* Top Navigation & Preview */}
            <div className="sticky top-0 z-10 bg-gray-100 pt-2 pb-4 mb-4 shadow-sm -mx-4 px-4">
              <div className="flex justify-between items-center mb-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Restart
                </button>
                
                <div className="text-gray-600 font-semibold">
                   {/* In random mode, show progress based on unique visits */}
                   {isRandomMode ? `${new Set(history).size} / ${questions.length}` : `${currentQuestionIndex + 1} / ${questions.length}`}
                </div>

                <button
                  onClick={() => setShowMap(true)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  Grid View
                </button>
              </div>

              {/* Random Mode Toggle */}
              <div className="flex justify-center items-center mb-3">
                <button
                  onClick={toggleRandomMode}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    isRandomMode 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  {isRandomMode ? 'Random Mode ON' : 'Sequential Mode'}
                </button>
              </div>

              {/* Scrollable Preview List */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide" ref={scrollRef}>
                {questions.map((q, idx) => {
                  const answer = userAnswers[q.id];
                  let statusColor = "bg-white border-gray-300 text-gray-500";
                  if (idx === currentQuestionIndex) {
                    statusColor = "bg-blue-600 border-blue-600 text-white ring-2 ring-blue-200";
                  } else if (answer === q.correctAnswer) {
                    statusColor = "bg-green-100 border-green-500 text-green-700";
                  } else if (answer) {
                    statusColor = "bg-red-100 border-red-500 text-red-700";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`flex-shrink-0 w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${statusColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-grow">
              <QuizCard
                question={currentQ}
                selectedOption={userAnswers[currentQ.id] || null}
                onSelectOption={handleOptionSelect}
                showFeedback={isAnswerRevealed}
              />
            </div>

            <div className="mt-8 flex justify-center pb-8 gap-4">
              <button
                onClick={handlePrev}
                disabled={historyIndex === 0}
                className={`
                  px-6 py-3 rounded-xl font-bold text-lg shadow-md transition-all transform
                  ${historyIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg hover:-translate-y-0.5'}
                `}
              >
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!isAnswerRevealed}
                className={`
                  px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform flex-1 max-w-xs
                  ${isAnswerRevealed 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5 shadow-blue-200' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}
                `}
              >
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>

            <QuestionMap 
              questions={questions}
              userAnswers={userAnswers}
              onSelectQuestion={handleJumpToQuestion}
              onClose={() => setShowMap(false)}
              isOpen={showMap}
            />
          </div>
        );

      case AppState.RESULT:
        return (
          <Results 
            result={calculateResults()} 
            onRetry={() => {
              // Reset for retry, keeping the same mode
              let startIndex = 0;
              if (isRandomMode && questions.length > 0) {
                startIndex = Math.floor(Math.random() * questions.length);
              }
              setHistory([startIndex]);
              setHistoryIndex(0);
              setUserAnswers({});
              setIsAnswerRevealed(false);
              setState(AppState.QUIZ);
            }}
            onHome={() => window.location.reload()}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {renderContent()}
    </div>
  );
};

export default App;