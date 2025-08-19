import core/answer.{type Answer, type History, Correct, NotAnswered}
import core/question
import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import interface/indexed_db.{type DB}
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import utils/effect_
import utils/list_ex

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
    answers: History,
    // クイズが終了したかどうかを示すフラグ。
    quiz_finished: Bool,
    score: Int,
    history: History,
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
pub fn init(
  db: DB,
  questions: List(question.Model),
  history: History,
) -> Result(Model, Nil) {
  case list.is_empty(questions) {
    True -> {
      Error(Nil)
    }
    False -> {
      // すべての問題を NotAnswered として answers Dict を初期化する
      let new_answers =
        questions
        |> list.map(fn(q) { #(q.id, NotAnswered) })
        |> dict.from_list

      Ok(Model(
        db: db,
        questions: questions,
        questions_count: list.length(questions),
        current_question_index: 0,
        answers: new_answers,
        quiz_finished: False,
        score: 0,
        history: history,
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
        list_ex.update_at(
          model.questions,
          model.current_question_index,
          question.update(_, q_msg),
        )
      #(Model(..model, questions: new_questions), effect.none())
    }
    NextQuestion -> {
      // 現在の問題の回答を answers に記録する
      let new_answers = update_answers(model)
      //スコア
      let new_score = get_score(new_answers)

      // 次の問題に進むか、クイズを終了する
      let next_index = model.current_question_index + 1
      let is_finished = next_index >= list.length(model.questions) |> echo
      case is_finished {
        True -> #(
          Model(
            ..model,
            answers: new_answers,
            quiz_finished: True,
            score: new_score,
          ),
          effect_.perform(GoToResultScreen),
        )
        False -> #(
          Model(
            ..model,
            answers: new_answers,
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

pub fn update_answers(model: Model) -> History {
  model.questions
  |> list_ex.get_at(model.current_question_index)
  |> fn(question) {
    case question {
      Some(q) -> {
        dict.insert(model.answers, q.id, question.check_answer(q))
      }
      None -> model.answers
    }
  }
}

// answers 辞書からスコアを計算する
pub fn get_score(answers: History) -> Int {
  answers
  |> dict.values
  |> list.filter(fn(answer) { answer == Correct })
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
  case list_ex.get_at(model.questions, model.current_question_index) {
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
  // answers 辞書からスコアを計算する
  let score = get_score(model.answers)
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
