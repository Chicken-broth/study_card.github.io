import core/answer.{type Answer}
import core/question.{type QusetionCategory}
import gleam/dynamic/decode
import gleam/int
import gleam/json
import gleam/list
import gleam/option
import lustre/attribute as attr
import lustre/element
import lustre/element/html

/// POST /api/quiz-results のリクエストボディで送信される個々の解答結果
pub type QuizResults =
  List(Record)

/// IndexedDBに保存される学習履歴のレコード
/// idはquiz id
pub type Record {
  Record(id: ID, category: QusetionCategory, answer: List(Answer))
}

pub type ID =
  Int

pub fn filter_exist_answers(rs: QuizResults) -> QuizResults {
  list.filter(rs, fn(r) {
    list.any(r.answer, fn(a) { a != answer.NotAnswered })
  })
}

pub fn get_incorrect_question_ids(quiz_results: QuizResults) -> List(Int) {
  quiz_results
  |> list.filter_map(fn(result) {
    case list.first(result.answer) {
      Ok(latest_answer) -> {
        case latest_answer {
          answer.Incorrect -> Ok(result.id)
          _ -> Error(Nil)
        }
      }
      Error(_) -> Error(Nil)
    }
  })
}

pub fn decoder() -> decode.Decoder(QuizResults) {
  decode.list({
    use id <- decode.field("id", decode.int)
    use category <- decode.field(
      "category",
      question.qusetion_category_decoder(),
    )
    use answers <- decode.field("answer", decode.list(answer.decoder()))
    decode.success(Record(id, category, answers))
  })
}

pub fn to_json(qr: QuizResults) -> json.Json {
  use record <- json.array(qr)
  json.object([
    #("id", json.int(record.id)),
    #("category", question.qusetion_category_to_json(record.category)),
    #("answer", json.array(record.answer, answer.to_json)),
  ])
}

pub fn from_questions(questions: List(question.Model)) -> QuizResults {
  list.map(questions, fn(q) {
    Record(id: q.id, category: q.category, answer: [])
  })
}

pub fn from_id_category(
  id_category_list: List(question.IdAndCategory),
) -> QuizResults {
  list.map(id_category_list, fn(a) {
    Record(id: a.id, category: a.category, answer: [answer.NotAnswered])
  })
}

fn view_answers(answers: List(Answer)) -> element.Element(msg) {
  html.div(
    [
      attr.styles([
        #("display", "flex"),
        #("flex-direction", "row"),
        #("gap", "0.5rem"),
        #("justify-content", "center"),
        #("align-items", "center"),
      ]),
    ],
    list.map(answers, answer.view),
  )
}

//中央寄せ
fn style_column() {
  attr.styles([
    #("text-align", "center"),
    #("padding-left", "1rem"),
    #("padding-right", "1rem"),
  ])
}

pub fn view(quiz_result: QuizResults) -> element.Element(msg) {
  // echo quiz_result
  // 各行の幅は広くとりたい
  html.table([], [
    html.thead([], [
      html.tr([], [
        html.th([style_column()], [html.text("ID")]),
        html.th([style_column()], [html.text("Category")]),
        html.th([style_column()], [html.text("Result")]),
      ]),
    ]),
    html.tbody(
      [],
      list.map(quiz_result, fn(h) {
        html.tr([], [
          html.td([style_column()], [html.text(int.to_string(h.id))]),
          html.td([style_column()], [html.text(h.category.name)]),
          html.td([style_column()], [view_answers(h.answer)]),
        ])
      }),
    ),
  ])
}
