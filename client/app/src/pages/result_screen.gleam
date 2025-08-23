import core/quiz_result.{type QuizResults}
import extra/promise_
import gleam/int
import interface/indexed_db.{type DB} as db
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

/// 結果画面のアプリケーションの状態
pub type Model {
  Model(db: DB, score: Int, total_questions: Int, quiz_result: QuizResults)
}

/// 結果画面を更新するためにディスパッチできるメッセージ
pub type Msg {
  // GetHistory(QuizResults)
  Err(db.Err)
  // SaveHistory
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
  echo quiz_result

  #(
    Model(
      db: db,
      score: score,
      total_questions: total_questions,
      quiz_result: quiz_result,
    ),
    effect.none(),
  )
}

/// 受信したメッセージに基づいてResultModelを更新する関数
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    Err(json_err) -> {
      echo "err screen"
      echo json_err
      #(model, none())
    }
    // SaveHistory -> {
    //   echo "SaveHistory"
    //   #(model, none())
    // }
    GoToHome -> {
      echo "GoToHome"
      let eff =
        // effect_.perform(OutCome)
        model.quiz_result
        |> quiz_result.to_json
        |> db.save_quiz_history(model.db, _)
        |> promise_.to_effect_no_decode(fn(_) { OutCome })
      #(model, eff)
    }
    // GetHistory(quiz_result) -> {
    //   echo "GetHistory"
    //       let eff =
    //       promise_.to_effect(
    //         db.get_quiz_historys(model.db),
    //         db.decode_quiz_historys,
    //         GetHistory,
    //         Err,
    //       )
    //   #(Model(..model, quiz_result: quiz_result), eff)
    // }
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
    html.button([event.on_click(GoToHome)], [html.text("Go to Home")]),
    html.h3([], [html.text("Detailed Results:")]),
    quiz_result.view(model.quiz_result),
    html.button([event.on_click(GoToHome)], [html.text("Go to Home")]),
  ])
}
