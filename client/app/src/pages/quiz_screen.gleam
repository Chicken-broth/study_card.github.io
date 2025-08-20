import core/answer.{Correct}
import core/question
import core/quiz_result.{type QuizResults, Record}
import extra/effect_
import extra/list_
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import interface/indexed_db.{type DB}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// --- 型定義とメッセージ ---------------------------------------------------

pub type Model {
  Model(
    db: DB,
    // クイズで出題される問題の完全なリスト。状態も保持する。
    questions: List(question.Model),
    questions_count: Int,
    // 現在表示されている問題のインデックス。
    current_question_index: Int,
    // ユーザーの回答履歴 (問題ID -> 正誤結果)。
    quiz_result: QuizResults,
    // クイズが終了したかどうかを示すフラグ。
    quiz_finished: Bool,
    score: Int,
  )
}

pub type Msg {
  // 現在の問題コンポーネントからのメッセージ。
  QuestionMsg(question.Msg)
  // ユーザーが次の問題に進むことを要求するメッセージ。
  NextQuestion
  OutCome
  // クイズが終了し、ユーザーが結果表示を要求するメッセージ。
  GoToResultScreen
}

// --- 初期化 ---------------------------------------------------------------

/// クイズ画面のモデルを初期化します。
pub fn init(db: DB, questions: List(question.Model)) -> Result(Model, Nil) {
  case list.is_empty(questions) {
    True -> {
      Error(Nil)
    }
    False -> {
      // すべての問題を NotAnswered として quiz_result を初期化する
      Ok(Model(
        db: db,
        questions: questions,
        questions_count: list.length(questions),
        current_question_index: 0,
        quiz_result: quiz_result.from_questions(questions),
        quiz_finished: False,
        score: 0,
      ))
    }
  }
}

// --- 更新ロジック ---------------------------------------------------------

pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    QuestionMsg(q_msg) -> {
      // 現在の問題を取得し、更新する
      let new_questions =
        list_.update_at(
          model.questions,
          model.current_question_index,
          question.update(_, q_msg),
        )
      #(Model(..model, questions: new_questions), effect.none())
    }
    NextQuestion -> {
      // 現在の問題の回答を quiz_result に記録する
      let new_quiz_result = update_quiz_result(model)
      //スコア
      let new_score = get_score(new_quiz_result)

      // 次の問題に進むか、クイズを終了する
      let next_index = model.current_question_index + 1
      let is_finished = next_index >= list.length(model.questions)
      case is_finished {
        True -> #(
          Model(
            ..model,
            quiz_result: new_quiz_result,
            quiz_finished: True,
            score: new_score,
          ),
          effect_.perform(GoToResultScreen),
        )
        False -> #(
          Model(
            ..model,
            quiz_result: new_quiz_result,
            current_question_index: next_index,
            score: new_score,
          ),
          effect.none(),
        )
      }
    }

    GoToResultScreen -> #(model, effect_.perform(OutCome))
    OutCome -> #(model, effect.none())
  }
}

pub fn update_quiz_result(model: Model) -> QuizResults {
  let current_question =
    list_.get_at(model.questions, model.current_question_index)
  case current_question {
    Some(q) -> {
      let new_answer = question.check_answer(q)
      list_.update_if(model.quiz_result, fn(r) { r.id == q.id }, fn(r) {
        Record(..r, answer: new_answer)
      })
    }
    None -> model.quiz_result
  }
}

// quiz_result からスコアを計算する
pub fn get_score(quiz_result: QuizResults) -> Int {
  quiz_result
  |> list.filter(fn(result) { result.answer == Correct })
  |> list.length
}

// --- ビュー -----------------------------------------------------------------
pub fn view(model: Model) -> Element(Msg) {
  case model.quiz_finished {
    True -> view_quiz_finished(model)
    False -> view_question(model)
  }
}

/// 現在の問題を描画します。
fn view_question(model: Model) -> Element(Msg) {
  case list_.get_at(model.questions, model.current_question_index) {
    Some(current_question) -> {
      let progress =
        "Question "
        <> int.to_string(model.current_question_index + 1)
        <> " of "
        <> int.to_string(list.length(model.questions))

      html.div([], [
        html.h2([], [html.text(progress)]),
        html.p([], [html.text(current_question.question_text)]),
        html.div([], [
          current_question
          |> question.view
          |> element.map(QuestionMsg),
        ]),
        html.button(
          [
            event.on_click(NextQuestion),
            // attr.disabled(!question.is_answered(current_question)),
          ],
          [html.text("Next")],
        ),
      ])
    }
    None -> html.text("Error: Question not found.")
  }
}

/// クイズ完了画面を描画します。
fn view_quiz_finished(model: Model) -> Element(Msg) {
  // quiz_result からスコアを計算する
  let score = get_score(model.quiz_result)
  let total_questions = list.length(model.questions)

  html.div([], [
    html.h2([], [html.text("Quiz Finished!")]),
    html.p([], [
      html.text(
        "Your score: "
        <> int.to_string(score)
        <> "/"
        <> int.to_string(total_questions),
      ),
    ]),
    html.button([event.on_click(GoToResultScreen)], [html.text("View Results")]),
  ])
}
