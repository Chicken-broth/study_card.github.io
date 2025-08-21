import core/answer.{Correct, Incorrect, NotAnswered}
import core/history.{type History}
import core/quiz_result.{type QuizResults}
import extra/promise_
import gleam/int
import gleam/list
import interface/indexed_db.{type DB} as db
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
    quiz_result: quiz_result.QuizResults,
    history: History,
  )
}

/// 結果画面を更新するためにディスパッチできるメッセージ
pub type Msg {
  GetHistory(History)
  Err(db.Err)
  SaveHistory
  GoToHome
  OutCome
}

/// ResultModelを初期化する関数
pub fn init(
  db: DB,
  score: Int,
  total_questions: Int,
  quiz_result: QuizResults,
) -> #(Model, Effect(Msg)) {
  let eff =
    promise_.to_effect(
      db.get_quiz_historys(db),
      db.decode_quiz_historys,
      GetHistory,
      Err,
    )
  #(
    Model(
      db: db,
      score: score,
      total_questions: total_questions,
      quiz_result: quiz_result,
      history: [],
    ),
    eff,
  )
}

/// 受信したメッセージに基づいてResultModelを更新する関数
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    GetHistory(history) -> {
      echo "GetHistory"
      let new_history =
        history.update_from_quiz_results(history, model.quiz_result)
      #(Model(..model, history: new_history), effect.none())
    }
    Err(json_err) -> {
      echo "err screen"
      echo json_err
      #(model, none())
    }
    SaveHistory -> {
      echo "SaveHistory"
      #(model, none())
    }
    GoToHome -> {
      echo "GoToHome"
      let eff =
        // effect_.perform(OutCome)
        model.history
        |> history.to_json
        |> db.save_quiz_history(model.db, _)
        |> promise_.to_effect_no_decode(fn(a) { OutCome })
      #(model, eff)
    }
    OutCome -> {
      echo "result -> home"
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
    view_answers(model.quiz_result),
    html.button([event.on_click(GoToHome)], [html.text("Go to Home")]),
  ])
}

fn view_answers(quiz_result: QuizResults) -> Element(Msg) {
  html.ul([], {
    use record <- list.map(quiz_result)
    let status_text = case record.answer {
      Correct -> "○"
      Incorrect -> "✖"
      NotAnswered -> "-"
    }
    html.li([], [html.text(int.to_string(record.id) <> ": " <> status_text)])
  })
}
