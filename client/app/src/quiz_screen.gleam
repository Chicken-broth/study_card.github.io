import answer.{type Answer, Correct, NotAnswered}
import gleam/dict.{type Dict}
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import list_ex
import lustre/attribute as attr
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import question

// --- 型定義とメッセージ ---------------------------------------------------

pub type Model {
  Model(
    // クイズで出題される問題の完全なリスト。状態も保持する。
    questions: List(question.Model),
    // 現在表示されている問題のインデックス。
    current_question_index: Int,
    // ユーザーの回答履歴 (問題ID -> 正誤結果)。
    user_answers: Dict(String, Answer),
    // クイズが終了したかどうかを示すフラグ。
    quiz_finished: Bool,
  )
}

pub type Msg {
  // 現在の問題コンポーネントからのメッセージ。
  QuestionMsg(question.Msg)
  // ユーザーが次の問題に進むことを要求するメッセージ。
  NextQuestion
  // クイズが終了し、ユーザーが結果表示を要求するメッセージ。
  GoToResultScreen
}

// --- 初期化 ---------------------------------------------------------------

/// クイズ画面のモデルを初期化します。
pub fn init(questions: List(question.Model)) -> Result(Model, Nil) {
  case list.is_empty(questions) {
    True -> {
      echo "No questions provided."
      Error(Nil)
    }
    False -> {
      // すべての問題を NotAnswered として user_answers Dict を初期化する
      let user_answers =
        questions
        |> list.map(fn(q) { #(q.id, NotAnswered) })
        |> dict.from_list

      Ok(Model(
        questions: questions,
        current_question_index: 0,
        user_answers: user_answers,
        quiz_finished: False,
      ))
    }
  }
}

// --- 更新ロジック ---------------------------------------------------------

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    QuestionMsg(q_msg) -> {
      // 現在の問題を取得し、更新する
      let new_questions =
        list_ex.update_at(
          model.questions,
          model.current_question_index,
          question.update(_, q_msg),
        )
      Model(..model, questions: new_questions)
    }
    NextQuestion -> handle_next_question(model)

    GoToResultScreen -> model
  }
}

/// 次の問題へ進むロジックを処理します。
fn handle_next_question(model: Model) -> Model {
  // 現在の問題の回答を user_answers に記録する
  let question = list_ex.get_at(model.questions, model.current_question_index)
  let new_answers = case question {
    Some(q) -> {
      dict.insert(model.user_answers, q.id, question.check_answer(q))
    }
    None -> model.user_answers
  }

  // 次の問題に進むか、クイズを終了する
  let next_index = model.current_question_index + 1
  case next_index >= list.length(model.questions) {
    True -> Model(..model, user_answers: new_answers, quiz_finished: True)
    False ->
      Model(
        ..model,
        user_answers: new_answers,
        current_question_index: next_index,
      )
  }
}

// user_answers 辞書からスコアを計算する
pub fn get_score(user_answers: Dict(String, Answer)) -> Int {
  user_answers
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
            attr.disabled(!question.is_answered(current_question)),
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
  // user_answers 辞書からスコアを計算する
  let score = get_score(model.user_answers)
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
