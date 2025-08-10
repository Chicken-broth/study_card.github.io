/// クイズの問題種別
/// - `MultipleChoice`: 四択問題
/// - `Association`: 組み合わせ問題
/// クイズのカテゴリ
pub type Category {
  Category(id: String, name: String)
}

/// 四択問題の選択肢
pub type MultipleChoiceOption {
  MultipleChoiceOption(id: String, text: String)
}

/// 組み合わせ問題のペア
pub type AssociationPair {
  AssociationPair(id: String, item: String, matching_item: String)
}

/// 四択問題
pub type MultipleChoiceQuestion {
  MultipleChoiceQuestion(
    one: MultipleChoiceOption,
    two: MultipleChoiceOption,
    three: MultipleChoiceOption,
    four: MultipleChoiceOption,
    correct_option_id: String,
  )
}

/// 組み合わせ問題
pub type AssociationQuestion {
  AssociationQuestion(pairs: List(AssociationPair))
}

pub type QuestionInteraction {
  MultipleChoice(MultipleChoiceQuestion)
  Association(AssociationQuestion)
}

/// クイズの問題
pub type Question {
  Question(
    id: String,
    category: Category,
    question_text: String,
    question_interaction: QuestionInteraction,
  )
}

/// POST /api/quiz-results のリクエストボディで送信される個々の解答結果
pub type QuizResult {
  QuizResult(
    question_id: String,
    is_correct: Bool,
  )
}

/// POST /api/quiz-results のリクエストボディ
pub type PostQuizResultsRequest {
  PostQuizResultsRequest(
    results: List(QuizResult),
  )
}

/// クイズ集計データの全体統計
pub type OverallStats {
  OverallStats(
    total_questions_answered: Int,
    average_correct_rate: Float,
  )
}

/// クイズ集計データのカテゴリ別統計
pub type CategoryStats {
  CategoryStats(
    category_id: String,
    category_name: String,
    total_questions_answered: Int,
    correct_rate: Float,
  )
}

/// GET /api/quiz-summary のレスポンス
pub type GetQuizSummaryResponse {
  GetQuizSummaryResponse(
    overall_stats: OverallStats,
    category_stats: List(CategoryStats),
  )
}