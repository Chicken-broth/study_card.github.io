import answer.{type Answer, Correct, Incorrect, NotAnswered}
import gleam/dict.{type Dict}
import gleam/int
import gleam/io
import gleam/list
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import question

/// 結果画面のアプリケーションの状態
pub type Model {
  Model(
    score: Int,
    total_questions: Int,
    user_answers: Dict(String, Answer),
    questions: List(question.Model),
  )
}

/// 結果画面を更新するためにディスパッチできるメッセージ
pub type Msg {
  GoToHome
}

/// ResultModelを初期化する関数
pub fn init(
  score: Int,
  total_questions: Int,
  user_answers: Dict(String, Answer),
  questions: List(question.Model),
) -> #(Model, Effect(Msg)) {
  #(
    Model(
      score: score,
      total_questions: total_questions,
      user_answers: user_answers,
      questions: questions,
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
    html.h3([], [html.text("Detailed Results")]),
    view_answers(model.user_answers),
    html.button([event.on_click(GoToHome)], [html.text("Go to Home")]),
  ])
}

fn view_answers(dic: Dict(String, Answer)) -> Element(Msg) {
  html.ul([], {
    use #(id, answer) <- list.map(dict.to_list(dic))
    let status_text = case answer {
      Correct -> "Correct"
      Incorrect -> "Incorrect"
      NotAnswered -> "Not Answered"
    }
    html.li([], [html.text(id <> ": " <> status_text)])
  })
}
