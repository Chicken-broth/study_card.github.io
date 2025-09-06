/// 個々の問題の解答状態
pub type Answer {
  Correct
  Incorrect
  NotAnswered
}

/// 問題のカテゴリ情報
pub type QusetionCategory {
  QusetionCategory(
    id: Int,
    name: String,
    sub_id: Int,
    sub_name: String,
  )
}

/// IndexedDBに保存される学習履歴のレコード1件分
/// `id` は問題のID
pub type QuizRecord {
  QuizRecord(
    id: Int,
    category: QusetionCategory,
    answer: List(Answer),
  )
}

/// 1回のクイズ挑戦の全記録
pub type QuizResults =
  List(QuizRecord)
