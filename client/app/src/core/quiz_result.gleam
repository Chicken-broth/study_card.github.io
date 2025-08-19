/// POST /api/quiz-results のリクエストボディで送信される個々の解答結果
pub type QuizResult {
  QuizResult(question_id: String, is_correct: Bool)
}

/// POST /api/quiz-results のリクエストボディ
pub type PostQuizResultsRequest {
  PostQuizResultsRequest(results: List(QuizResult))
}

/// クイズ集計データの全体統計
pub type OverallStats {
  OverallStats(total_questions_answered: Int, average_correct_rate: Float)
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
