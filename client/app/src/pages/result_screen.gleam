import core/answer.{type History, Correct, Incorrect, NotAnswered}
import gleam/dict.{type Dict}
import gleam/int
import gleam/io
import gleam/list
import interface/indexed_db.{type DB}
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

/// 結果画面のアプリケーションの状態
pub type Model {
  Model(
    db: DB,
    score: Int,
    total_questions: Int,
    answers: History,
    history: History,
  )
}

/// 結果画面を更新するためにディスパッチできるメッセージ
pub type Msg {
  GoToHome
}

/// ResultModelを初期化する関数
pub fn init(
  db: DB,
  score: Int,
  total_questions: Int,
  answers: History,
  history: History,
) -> #(Model, Effect(Msg)) {
  #(
    Model(
      db: db,
      score: score,
      total_questions: total_questions,
      answers: answers,
      history: history,
    ),
    none(),
  )
}

/// 受信したメッセージに基づいてResultModelを更新する関数
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    GoToHome -> {
      io.println("Navigating to Home Screen...")
      #(model, none())
    }
  }
}

/// 現在のResultModelに基づいて結果画面のUIをレンダリングする関数
pub fn view(model: Model) -> Element(Msg) {
  html.div([], [
    html.h2([], [html.text("Quiz Results")]),
    html.p([], [
      html.text(
        "Your score: "
        <> int.to_string(model.score)
        <> "/"
        <> int.to_string(model.total_questions),
      ),
    ]),
    html.h3([], [html.text("Detailed Results:")]),
    view_answers(model.answers),
    html.button([event.on_click(GoToHome)], [html.text("Go to Home")]),
  ])
}

fn view_answers(dic: History) -> Element(Msg) {
  html.ul([], {
    use #(id, answer) <- list.map(dict.to_list(dic))
    let status_text = case answer {
      Correct -> "○"
      Incorrect -> "✖"
      NotAnswered -> "-"
    }
    html.li([], [html.text(int.to_string(id) <> ": " <> status_text)])
  })
}
