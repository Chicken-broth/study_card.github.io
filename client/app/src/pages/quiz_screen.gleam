import core/answer.{Correct}
import core/question
import core/quiz_result.{type QuizResults, Record}
import db/indexed_db.{type DB}
import extra/effect_
import extra/list_
import gleam/int
import gleam/list
import gleam/option.{None, Some}
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// --- 型定義とメッセージ ---------------------------------------------------

/// クイズ画面の状態を保持するモデル。
pub type Model {
  Model(
    /// データベースへの接続。
    db: DB,
    /// クイズで出題される問題のリスト。各問題の状態も含まれる。
    questions: List(question.Model),
    /// 問題の総数。
    questions_count: Int,
    /// 現在表示されている問題のインデックス（0から始まる）。
    current_question_index: Int,
    /// ユーザーの回答結果を保持するリスト。
    quiz_result: QuizResults,
    /// クイズがすべて完了したかどうかを示すフラグ。
    quiz_finished: Bool,
    /// 現在のスコア。
    score: Int,
  )
}

/// クイズ画面で発生するイベント（メッセージ）。
pub type Msg {
  /// 個々の問題コンポーネントから送られてくるメッセージ。
  QuestionMsg(question.Msg)
  /// 「次へ」ボタンがクリックされたときに送信される。
  NextQuestion
  /// 親コンポーネント（`study_app`）に画面遷移を伝えるためのメッセージ。
  OutCome
  /// 結果画面へ遷移する際に送信される。
  GoToResultScreen
}

// --- 初期化 ---------------------------------------------------------------

/// クイズ画面のモデルを初期化する。
///
/// Args:
///   - db: データベース接続。
///   - questions: ホーム画面で選択された問題のリスト。
///
/// Returns:
///   - 問題リストが空でなければ、初期化されたモデルを返す。
///   - 問題リストが空の場合は、エラーを返す。
///
pub fn init(db: DB, questions: List(question.Model)) -> Result(Model, Nil) {
  // デバッグ用：渡された問題IDをコンソールに出力する
  list.map(questions, fn(q) { q.id }) |> echo
  case list.is_empty(questions) {
    True -> {
      // 問題がなければエラー
      Error(Nil)
    }
    False -> {
      // モデルを初期化する
      Ok(Model(
        db: db,
        questions: questions,
        questions_count: list.length(questions),
        current_question_index: 0,
        // すべての問題を「未回答」として結果リストを作成する
        quiz_result: quiz_result.from_questions(questions),
        quiz_finished: False,
        score: 0,
      ))
    }
  }
}

// --- 更新ロジック ---------------------------------------------------------

/// メッセージを受け取り、モデルを更新する。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    // 個々の問題コンポーネントからのメッセージを処理
    QuestionMsg(q_msg) -> {
      // 現在の問題の状態を更新する
      let new_questions =
        list_.update_at(
          model.questions,
          model.current_question_index,
          question.update(_, q_msg),
        )
      #(Model(..model, questions: new_questions), effect.none())
    }

    // 「次へ」ボタンがクリックされたときの処理
    NextQuestion -> {
      // 現在の回答を記録し、スコアを更新する
      let new_quiz_result = update_quiz_result(model)
      let new_score = get_score(new_quiz_result)

      // 次の問題へ進む
      let next_index = model.current_question_index + 1
      let is_finished = next_index >= list.length(model.questions)

      case is_finished {
        // すべての問題が終わった場合
        True -> #(
          Model(
            ..model,
            quiz_result: new_quiz_result,
            quiz_finished: True,
            score: new_score,
          ),
          // 結果画面への遷移をトリガーする
          effect_.perform(GoToResultScreen),
        )
        // まだ問題が残っている場合
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

    // 結果画面への遷移を親コンポーネントに依頼する
    GoToResultScreen -> {
      // クイズが既に終了している場合は、そのまま画面遷移のみ行う。
      // 途中で終了した場合は、現在の問題の回答を記録してから遷移する。
      case model.quiz_finished {
        True -> #(model, effect_.perform(OutCome))
        False -> {
          let new_quiz_result = update_quiz_result(model)
          let new_score = get_score(new_quiz_result)
          #(
            Model(
              ..model,
              quiz_result: new_quiz_result,
              quiz_finished: True,
              score: new_score,
            ),
            effect_.perform(OutCome),
          )
        }
      }
    }

    // 親コンポーネントからの画面遷移完了通知（ここでは何もしない）
    OutCome -> #(model, effect.none())
  }
}

/// 現在の問題の回答状況をチェックし、結果リストを更新する。
pub fn update_quiz_result(model: Model) -> QuizResults {
  // 現在の問題を取得
  let current_question =
    list_.get_at(model.questions, model.current_question_index)

  case current_question {
    Some(q) -> {
      // 回答が正しいかチェックする
      let new_answer = question.check_answer(q)
      // echo "new_answer"
      // echo new_answer
      // 結果リスト内の該当する問題の回答状況を更新する
      list_.update_if(model.quiz_result, fn(r) { r.id == q.id }, fn(r) {
        Record(..r, answer: [new_answer])
      })
    }
    // 問題が見つからなければ、何もせず結果リストを返す
    None -> model.quiz_result
  }
}

/// 結果リストから正解数を計算してスコアを返す。
pub fn get_score(quiz_result: QuizResults) -> Int {
  quiz_result
  |> list.filter(fn(r) {
    case r.answer {
      [Correct, ..] -> True
      _ -> False
    }
  })
  |> list.length
}

// --- ビュー -----------------------------------------------------------------

/// モデルの状態に応じて、問題画面または完了画面を描画する。
pub fn view(model: Model) -> Element(Msg) {
  case model.quiz_finished {
    True -> view_quiz_finished(model)
    False -> view_question(model)
  }
}

/// 現在の問題を描画する。
fn view_question(model: Model) -> Element(Msg) {
  case list_.get_at(model.questions, model.current_question_index) {
    Some(current_question) ->
      html.div([], [
        view_progress(
          model.current_question_index,
          list.length(model.questions),
        ),
        view_question_header(current_question),
        view_question_body(current_question),
        view_navigation_buttons(current_question),
      ])
    None -> html.text("Error: Question not found.")
  }
}

/// 進捗状況を表示するビュー
///
/// Args:
///   - current_index: 現在の問題のインデックス
///   - total_questions: 問題の総数
///
fn view_progress(current_index: Int, total_questions: Int) -> Element(Msg) {
  let progress =
    "Question "
    <> int.to_string(current_index + 1)
    <> " / "
    <> int.to_string(total_questions)
  html.h2([], [html.text(progress)])
}

/// 問題のヘッダー（カテゴリとID）を表示するビュー
///
/// Args:
///   - current_question: 現在の問題モデル
///
fn view_question_header(current_question: question.Model) -> Element(Msg) {
  html.h3([], [
    //縦に並べます
    html.div([], [html.text("id:" <> int.to_string(current_question.id))]),
    html.div([], [html.text("category:" <> current_question.category.name)]),
    html.div([], [
      html.text("sub_category:" <> current_question.category.sub_name),
    ]),
  ])
}

/// 問題の本体（問題文と選択肢）を表示するビュー
///
/// Args:
///   - current_question: 現在の問題モデル
///
fn view_question_body(current_question: question.Model) -> Element(Msg) {
  html.div([], [
    html.p([], [html.text(current_question.question_text)]),
    html.div([], [
      current_question
      |> question.view
      |> element.map(QuestionMsg),
    ]),
  ])
}

/// ナビゲーションボタン（次へ、結果を見る）を表示するビュー
///
/// Args:
///   - current_question: 現在の問題モデル
///
fn view_navigation_buttons(current_question: question.Model) -> Element(Msg) {
  html.div([], [
    html.div([], [
      html.button(
        [
          event.on_click(NextQuestion),
          // TODO: 回答されるまでボタンを無効化する
        // attr.disabled(!question.is_answered(current_question)),
        ],
        [html.text("Next")],
      ),
    ]),
    html.div([], [
      html.button(
        [
          attr.styles([#("margin-top", "1rem")]),
          event.on_click(GoToResultScreen),
        ],
        [html.text("GoResult")],
      ),
    ]),
  ])
}

/// クイズ完了画面を描画します。
fn view_quiz_finished(model: Model) -> Element(Msg) {
  // スコアと問題数を取得
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
    // 結果画面へ遷移するボタン
    html.button([event.on_click(GoToResultScreen)], [html.text("View Results")]),
  ])
}
