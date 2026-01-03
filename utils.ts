import { Question, Option } from './types';

// Parse questions from JSON format (extracted_questions.json)
export const parseQuestionsFromJSON = (jsonData: any[]): Question[] => {
  return jsonData.map(item => ({
    id: item.index,
    questionText: item.question,
    options: [
      { id: 'a', text: item.options.a },
      { id: 'b', text: item.options.b },
      { id: 'c', text: item.options.c }
    ],
    correctAnswer: item.answer.toLowerCase()
  }));
};

export const parseQuestions = (text: string): Question[] => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const questions: Question[] = [];
  
  let currentQuestion: Partial<Question> | null = null;
  let currentOptions: Option[] = [];

  // Regex patterns based on the provided text format
  // Matches: 1.1, 1.2, 2.1 or just 1. Question text
  const questionStartRegex = /^(\d+(\.\d+)?)\s+(.*)/; 
  // Matches: a. option text, a) option text
  const optionRegex = /^([a-zA-Z])[\.\、\)]\s+(.*)/; 
  // Matches: 答案：a, 答案: a
  const answerRegex = /^答案[:：]\s*([a-zA-Z])/i;
  // Matches Category headers like "1. 體力處理操作" (Optional detection)
  const categoryRegex = /^\d+\.\s+[\u4e00-\u9fa5]+/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Answer first (usually ends a block)
    const answerMatch = line.match(answerRegex);
    if (answerMatch && currentQuestion) {
      currentQuestion.correctAnswer = answerMatch[1].toLowerCase();
      currentQuestion.options = [...currentOptions];
      
      // Validate complete question
      if (currentQuestion.id && currentQuestion.questionText && currentQuestion.options.length > 0) {
        questions.push(currentQuestion as Question);
      }
      
      // Reset
      currentQuestion = null;
      currentOptions = [];
      continue;
    }

    // Check for Option
    const optionMatch = line.match(optionRegex);
    if (optionMatch && currentQuestion) {
      currentOptions.push({
        id: optionMatch[1].toLowerCase(),
        text: optionMatch[2].trim()
      });
      continue;
    }

    // Check for Question Start
    const questionMatch = line.match(questionStartRegex);
    // Ensure it's not a category header (usually category headers don't have decimals like 1.1)
    // But if it is like "1.1", it is definitely a question.
    if (questionMatch) {
        // If we were parsing a previous question that didn't have an explicit answer line yet, 
        // we might need to close it (though format implies Answer line always exists).
        // Let's assume strict format for now.
        
        currentQuestion = {
            id: questionMatch[1],
            questionText: questionMatch[3].trim(),
            options: [],
            correctAnswer: ''
        };
        currentOptions = [];
        continue;
    }
  }

  return questions;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// A small sample of the provided data for default state
export const DEFAULT_DATA = `
1.1 工友搬運重物時，應依從下列哪一項做法才正確？ 
a. 採用搬運姿勢應盡量保持背部挺直 
b. 盡量搬多一些，快點完成工作減少意外機會 
c. 盡量將物件遠離身體
答案：a 

1.2 下列哪一項不是正確人力提舉的要點？ 
a. 貨物提舉時，使用腰部力量 
b. 用手掌緊握貨物，手臂要緊貼身體 
c. 利用雙腳來改變方向
答案：a 

1.3 提舉重物時，最適宜運用身體哪部份的肌肉？ 
a. 腰背 
b. 腿部 
c. 手臂
答案：b

1.4 人體的最大提舉能力是當手握貨物底部離地多少距離？ 
a. 300至500毫米 
b. 500至700毫米 
c. 700至900毫米
答案：b 

1.5 下列哪一項不是由於使用錯誤提舉重物姿勢所引致的健康損害？ 
a. 腰背扭傷 
b. 疝氣 
c. 下肢靜脈曲張
答案：c 
`;