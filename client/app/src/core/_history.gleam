import core/answer.{type Answer}
import core/category.{type Category}
import core/question
import core/quiz_result
import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import lustre/element
import lustre/element/html

// import interface/indexed_db

/// POST /api/quiz-results のリクエストボディで送信される個々の解答結果
pub type History =
  List(Record)

/// IndexedDBに保存される学習履歴のレコード
pub type Record {
  Record(id: ID, category: Category, answer: Answer)
}

pub type ID =
  Int

/// JSONからQuizResultRecordをデコードするためのデコーダー
pub fn decoder() -> decode.Decoder(History) {
  decode.list({
    use id <- decode.field("id", decode.int)
    use category <- decode.field("category", category.decoder())
    use answers <- decode.field("answer", decode.list(answer.decoder()))
    decode.success(Record(id, category, history))
  })
}

pub fn to_json(history: History) {
  use record <- json.array(history)
  json.object([
    #("id", json.int(record.id)),
    #("category", category.to_json(record.category)),
    #("answer", json.string(answer.to_string(record.answer))),
  ])
}

pub fn update_from_quiz_results(
  history: History,
  results: quiz_result.QuizResults,
) -> History {
  use record <- list.map(history)
  let result = list.find(results, fn(result) { record.id == result.id })
  case result {
    Ok(a) -> Record(..record, answer: a.answer)
    Error(Nil) -> record
  }
}

pub fn from_id_category(id_category_list: List(question.IdAndCategory)) {
  list.map(id_category_list, fn(a) {
    Record(id: a.id, category: a.category, answer: answer.NotAnswered)
  })
}

pub fn view(history: History) -> element.Element(msg) {
  html.table([], [
    html.thead([], [
      html.tr([], [
        html.th([], [html.text("ID")]),
        html.th([], [html.text("Category")]),
        html.th([], [html.text("Result")]),
      ]),
    ]),
    html.tbody(
      [],
      list.map(history, fn(h) {
        html.tr([], [
          html.td([], [html.text(int.to_string(h.id))]),
          html.td([], [html.text(h.category.name)]),
          html.td([], [answer.view(h.answer)]),
        ])
      }),
    ),
  ])
}
