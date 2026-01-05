import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState, Question, QuizResult } from './types';
import Uploader from './components/Uploader';
import QuizCard from './components/QuizCard';
import Results from './components/Results';
import QuestionMap from './components/QuestionMap';
import { getUniqueSections, filterQuestionsBySections, getSectionFromIndex } from './utils';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.QUIZ);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // All loaded questions
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]); // Filtered questions for current quiz
  
  // Navigation State
  const [history, setHistory] = useState<number[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Section selection
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Mistakes tracking (persisted across sessions)
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());
  const [isMistakesOnlyMode, setIsMistakesOnlyMode] = useState(false);

  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentQuestionIndex = history[historyIndex] ?? 0;

  // Get available sections from all questions
  const availableSections = useMemo(() => getUniqueSections(allQuestions), [allQuestions]);

  // Load questions from fixed file path on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Use import.meta.env.BASE_URL to get the correct base path for GitHub Pages
        const basePath = import.meta.env.BASE_URL || '/';
        const questionPath = `${basePath}Question/extracted_questions.json`;
        const response = await fetch(questionPath);
        
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.status}`);
        }
        
        const jsonData = await response.json();
        const { parseQuestionsFromJSON } = await import('./utils');
        const parsedQuestions = parseQuestionsFromJSON(jsonData);
        
        if (parsedQuestions.length > 0) {
          setAllQuestions(parsedQuestions);
          setActiveQuestions(parsedQuestions);
          setHistory([0]);
          setHistoryIndex(0);
          setUserAnswers({});
          setIsAnswerRevealed(false);
          setShowMap(false);
          
          // Load saved mistakes from localStorage
          const savedMistakes = localStorage.getItem('quiz-mistakes');
          if (savedMistakes) {
            setMistakeIds(new Set(JSON.parse(savedMistakes)));
          }
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
    if (scrollRef.current && activeQuestions.length > 0) {
      const button = scrollRef.current.children[currentQuestionIndex] as HTMLElement;
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentQuestionIndex, activeQuestions.length]);

  // Save mistakes to localStorage whenever they change
  useEffect(() => {
    if (mistakeIds.size > 0) {
      localStorage.setItem('quiz-mistakes', JSON.stringify(Array.from(mistakeIds)));
    }
  }, [mistakeIds]);

  const handleQuestionsLoaded = (parsedQuestions: Question[], isRandom: boolean) => {
    setAllQuestions(parsedQuestions);
    setActiveQuestions(parsedQuestions);
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
    const questionId = activeQuestions[questionIndex].id;
    setIsAnswerRevealed(!!userAnswers[questionId]);
  };

  const handleOptionSelect = (optionId: string) => {
    const question = activeQuestions[currentQuestionIndex];
    setUserAnswers(prev => ({ ...prev, [question.id]: optionId }));
    setIsAnswerRevealed(true);
    
    // Track mistakes
    if (optionId !== question.correctAnswer) {
      setMistakeIds(prev => new Set([...prev, question.id]));
    } else {
      // Remove from mistakes if answered correctly
      setMistakeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(question.id);
        return newSet;
      });
    }
  };

  const toggleRandomMode = () => {
    setIsRandomMode(prev => !prev);
  };

  // Apply filters and start quiz with filtered questions
  const applyFiltersAndStart = () => {
    let filtered = allQuestions;
    
    // Filter by sections if any selected
    if (selectedSections.length > 0) {
      filtered = filterQuestionsBySections(filtered, selectedSections);
    }
    
    // Filter by mistakes only if enabled
    if (isMistakesOnlyMode) {
      filtered = filtered.filter(q => mistakeIds.has(q.id));
    }
    
    if (filtered.length === 0) {
      alert(isMistakesOnlyMode ? 'No mistakes to review!' : 'No questions match the selected filters.');
      return;
    }
    
    setActiveQuestions(filtered);
    
    // Determine start index
    let startIndex = 0;
    if (isRandomMode && filtered.length > 0) {
      startIndex = Math.floor(Math.random() * filtered.length);
    }
    
    setHistory([startIndex]);
    setHistoryIndex(0);
    setUserAnswers({});
    setIsAnswerRevealed(false);
    setShowSectionModal(false);
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const selectAllSections = () => {
    setSelectedSections(availableSections);
  };

  const clearAllSections = () => {
    setSelectedSections([]);
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
      const unvisited = activeQuestions
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
      if (currentQuestionIndex >= activeQuestions.length - 1) {
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
    const historyData = activeQuestions.map(q => {
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
      total: activeQuestions.length,
      correct,
      wrong: activeQuestions.length - correct,
      history: historyData
    };
  };

  const startMistakesOnlyQuiz = () => {
    const mistakeQuestions = allQuestions.filter(q => mistakeIds.has(q.id));
    if (mistakeQuestions.length === 0) {
      alert('No mistakes to review! Great job!');
      return;
    }
    
    setActiveQuestions(mistakeQuestions);
    setIsMistakesOnlyMode(true);
    
    let startIndex = 0;
    if (isRandomMode && mistakeQuestions.length > 0) {
      startIndex = Math.floor(Math.random() * mistakeQuestions.length);
    }
    
    setHistory([startIndex]);
    setHistoryIndex(0);
    setUserAnswers({});
    setIsAnswerRevealed(false);
    setState(AppState.QUIZ);
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
        if (activeQuestions.length === 0) return null;
        const currentQ = activeQuestions[currentQuestionIndex];
        
        // Determine if this is the last question (for button text)
        const visitedSet = new Set(history);
        const isLastQuestion = isRandomMode 
          ? visitedSet.size === activeQuestions.length && historyIndex === history.length - 1
          : currentQuestionIndex === activeQuestions.length - 1 && historyIndex === history.length - 1;

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
                   {isRandomMode ? `${new Set(history).size} / ${activeQuestions.length}` : `${currentQuestionIndex + 1} / ${activeQuestions.length}`}
                   {isMistakesOnlyMode && <span className="ml-2 text-orange-500 text-xs">(Mistakes)</span>}
                </div>

                <button
                  onClick={() => setShowMap(true)}
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  Grid View
                </button>
              </div>

              {/* Mode Controls */}
              <div className="flex justify-center items-center gap-2 mb-3 flex-wrap">
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
                  {isRandomMode ? 'Random' : 'Sequential'}
                </button>

                <button
                  onClick={() => setShowSectionModal(true)}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                  </svg>
                  Sections {selectedSections.length > 0 ? `(${selectedSections.length})` : ''}
                </button>

                {mistakeIds.size > 0 && (
                  <button
                    onClick={startMistakesOnlyQuiz}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      isMistakesOnlyMode
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    Mistakes ({mistakeIds.size})
                  </button>
                )}
              </div>

              {/* Scrollable Preview List */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide" ref={scrollRef}>
                {activeQuestions.map((q, idx) => {
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
                      title={`Question ${q.id}`}
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
              questions={activeQuestions}
              userAnswers={userAnswers}
              onSelectQuestion={handleJumpToQuestion}
              onClose={() => setShowMap(false)}
              isOpen={showMap}
            />

            {/* Section Selection Modal */}
            {showSectionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">Select Sections</h3>
                      <button
                        onClick={() => setShowSectionModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Choose which sections to include in your quiz</p>
                  </div>
                  
                  <div className="p-4 border-b border-gray-200 flex gap-2">
                    <button
                      onClick={selectAllSections}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllSections}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[40vh]">
                    <div className="grid grid-cols-4 gap-2">
                      {availableSections.map(section => {
                        const sectionQuestionCount = allQuestions.filter(q => getSectionFromIndex(q.id) === section).length;
                        const isSelected = selectedSections.includes(section);
                        return (
                          <button
                            key={section}
                            onClick={() => toggleSection(section)}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-bold text-lg">{section}</div>
                            <div className="text-xs opacity-70">{sectionQuestionCount} Q</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMistakesOnlyMode}
                          onChange={(e) => setIsMistakesOnlyMode(e.target.checked)}
                          className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Mistakes only ({mistakeIds.size})
                        </span>
                      </label>
                    </div>
                    <button
                      onClick={applyFiltersAndStart}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                    >
                      Start Quiz ({selectedSections.length === 0 ? 'All Sections' : `${selectedSections.length} Section${selectedSections.length > 1 ? 's' : ''}`})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case AppState.RESULT:
        return (
          <Results 
            result={calculateResults()} 
            mistakeCount={mistakeIds.size}
            onRetry={() => {
              // Reset for retry, keeping the same mode
              let startIndex = 0;
              if (isRandomMode && activeQuestions.length > 0) {
                startIndex = Math.floor(Math.random() * activeQuestions.length);
              }
              setHistory([startIndex]);
              setHistoryIndex(0);
              setUserAnswers({});
              setIsAnswerRevealed(false);
              setState(AppState.QUIZ);
            }}
            onRedoMistakes={startMistakesOnlyQuiz}
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