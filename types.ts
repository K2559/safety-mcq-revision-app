export interface Option {
  id: string; // 'a', 'b', 'c', etc.
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  options: Option[];
  correctAnswer: string; // 'a', 'b', etc.
  category?: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  history: {
    questionId: string;
    userSelected: string;
    isCorrect: boolean;
  }[];
}