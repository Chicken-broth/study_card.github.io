/**
 * クイズのカテゴリ
 */
export interface Category {
  id: number;
  name: string;
}

/**
 * 四択問題
 */
export interface MultipleChoiceQuestion {
  texts: string[];
  correct_answer_index: number;
}

/**
 * 組み合わせ問題のペア
 */
export interface AssociationPair {
  id: number;
  left: string;
  right: string;
}

/**
 * 問題のインタラクション部分
 */
export type QuestionInteraction =
  | { type: 'MultipleChoice'; data: MultipleChoiceQuestion }
  | { type: 'Association'; data: AssociationPair[] };

/**
 * クイズの問題
 */
export interface Question {
  id: number;
  category: Category;
  question_text: string;
  question_interaction: QuestionInteraction;
}

// --- APIリクエスト/レスポンス --- //

/**
 * GET /api/questions のリクエストクエリ
 */
export interface GetQuestionsQuery {
  categories: string; // カンマ区切りのカテゴリID
  count: number;
}

/**
 * GET /api/categories のレスポンス
 */
export interface GetCategoriesResponse {
  categories: Category[];
}

/**
 * POST /api/quiz-results のリクエストボディで送信される個々の解答結果
 */
export interface QuizResult {
  question_id: string;
  is_correct: boolean;
}

/**
 * POST /api/quiz-results のリクエストボディ
 */
export interface PostQuizResultsRequest {
  results: QuizResult[];
}

/**
 * クイズ集計データの全体統計
 */
export interface OverallStats {
  total_questions_answered: number;
  average_correct_rate: number;
}

/**
 * クイズ集計データのカテゴリ別統計
 */
export interface CategoryStats {
  category_id: string;
  category_name: string;
  total_questions_answered: number;
  correct_rate: number;
}

/**
 * GET /api/quiz-summary のレスポンス
 */
export interface GetQuizSummaryResponse {
  overall_stats: OverallStats;
  category_stats: CategoryStats[];
}

/**
 * 汎用APIレスポンス
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}