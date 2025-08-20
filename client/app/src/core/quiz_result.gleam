import core/answer.{type Answer}
import core/category.{type Category}
import core/question
import gleam/dynamic/decode
import gleam/list

/// POST /api/quiz-results のリクエストボディで送信される個々の解答結果
pub type QuizResults =
  List(Record)

/// IndexedDBに保存される学習履歴のレコード
pub type Record {
  Record(id: ID, category: Category, answer: Answer)
}

pub type ID =
  Int

/// JSONからQuizResultRecordをデコードするためのデコーダー
pub fn decoder() -> decode.Decoder(List(Record)) {
  decode.list({
    use id <- decode.field("id", decode.int)
    use category <- decode.field("category", category.decoder())
    decode.success(Record(id, category, answer.NotAnswered))
  })
}

pub fn from_questions(questions: List(question.Model)) -> QuizResults {
  list.map(questions, fn(q) {
    Record(id: q.id, category: q.category, answer: answer.NotAnswered)
  })
}
