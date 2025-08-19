import core/answer.{type Answer, Correct, Incorrect, NotAnswered}
import gleam/dynamic/decode
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// -- TYPES --------------------------------------------------------------------

/// ユーザー操作によって発行されるメッセージ。
/// 選択肢のインデックス(0-3)を保持します。
pub type Msg {
  Select(Int)
}

/// ユーザーの解答状態を表します。
/// 四択問題のデータ構造。
/// 選択肢のテキストリストと、正解のインデックスを保持します。
pub type MultipleChoiceQuestion {
  MultipleChoiceQuestion(texts: List(String), correct_answer_index: Int)
}

/// このコンポーネントの状態。
pub type Model {
  Model(
    question: MultipleChoiceQuestion,
    // ユーザーが選択した選択肢のインデックス。
    selected_index: Option(Int),
    // ユーザーの解答の状態。
    answer: Answer,
  )
}

// -- LOGIC --------------------------------------------------------------------

/// 問題を受け取って、Modelを初期化します。
pub fn init(texts: List(String), answer_index: Int) -> Model {
  let question = MultipleChoiceQuestion(texts, answer_index)
  Model(question: question, selected_index: None, answer: NotAnswered)
}

/// メッセージを受け取って、Modelを更新します。
pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    // ユーザーが答えを選択した時
    Select(index) ->
      case model.selected_index {
        // すでに選択されている選択肢を再度クリックした場合は、選択を解除
        Some(selected) if selected == index ->
          Model(..model, selected_index: None, answer: NotAnswered)
        // 新しい選択肢がクリックされた場合
        _ -> {
          let new_answer_state = case
            index == model.question.correct_answer_index
          {
            True -> Correct
            False -> Incorrect
          }
          Model(..model, selected_index: Some(index), answer: new_answer_state)
        }
      }
  }
}

// -- VIEW ---------------------------------------------------------------------

/// Modelの状態に基づいてUIを描画します。
pub fn view(model: Model) -> Element(Msg) {
  let options = {
    use text, i <- list.index_map(model.question.texts)
    // 各選択肢をボタンとして描画
    view_option(text, i, model)
  }

  html.div([], list.append(options, [view_answer_status(model.answer)]))
}

/// 解答の状態を表示する
fn view_answer_status(answer: Answer) -> Element(Msg) {
  let text = case answer {
    Correct -> "正解です！"
    Incorrect -> "不正解です。"
    NotAnswered -> ""
  }

  let text_color = case answer {
    Correct -> "#28a745"
    // Green
    Incorrect -> "#dc3545"
    // Red
    NotAnswered -> "#6c757d"
    // Gray
  }

  html.div(
    [
      attribute.styles([
        #("margin-top", "16px"),
        #("height", "24px"),
        #("font-weight", "bold"),
        #("text-align", "center"),
        #("color", text_color),
      ]),
    ],
    [element.text(text)],
  )
}

/// 個々の選択肢ボタンを描画します。
fn view_option(text: String, index: Int, model: Model) -> Element(Msg) {
  html.button(
    [event.on_click(Select(index)), base_style(), dynamic_style(index, model)],
    [element.text(text)],
  )
}

fn base_style() {
  attribute.styles([
    #("width", "100%"),
    #("padding", "12px"),
    #("margin", "4px 0"),
    #("border", "1px solid #ccc"),
    #("border-radius", "4px"),
    #("text-align", "left"),
    #("font-size", "16px"),
    #("cursor", "pointer"),
  ])
}

// 解答状態に応じて動的なスタイルを決定
fn dynamic_style(index: Int, model: Model) {
  let selected_index = model.selected_index
  let answer = model.answer
  let correct_index = model.question.correct_answer_index

  case answer {
    NotAnswered ->
      // No answer selected yet
      attribute.styles([#("background-color", "#f8f9fa")])
    Correct ->
      // User selected the correct answer
      case selected_index {
        Some(s_index) if s_index == index ->
          attribute.styles([
            #("background-color", "#d4edda"),
            // green
            #("border-color", "#c3e6cb"),
          ])
        _ -> attribute.styles([#("background-color", "#f8f9fa")])
      }
    Incorrect ->
      // User selected an incorrect answer
      case selected_index {
        Some(s_index) if s_index == index ->
          // This is the selected, incorrect answer
          attribute.styles([
            #("background-color", "#f8d7da"),
            // red
            #("border-color", "#f5c6cb"),
          ])
        _ if index == correct_index ->
          // This is the correct answer, which was not selected
          attribute.styles([
            #("background-color", "#d4edda"),
            // green
            #("border-color", "#c3e6cb"),
          ])
        _ -> attribute.styles([#("background-color", "#f8f9fa")])
      }
  }
}

// -- JSON SERIALIZATION -------------------------------------------------------

/// `MultipleChoiceQuestion`をJSONに変換します。
pub fn to_json(model: Model) -> json.Json {
  json.object([
    #("texts", json.array(model.question.texts, json.string)),
    #("correct_answer_index", json.int(model.question.correct_answer_index)),
  ])
}

/// JSONから`MultipleChoiceQuestion`にデコードします。
pub fn decoder() -> decode.Decoder(Model) {
  use texts <- decode.field("texts", decode.list(decode.string))
  use correct_answer_index <- decode.field("correct_answer_index", decode.int)
  decode.success(Model(
    question: MultipleChoiceQuestion(texts, correct_answer_index),
    selected_index: None,
    answer: NotAnswered,
  ))
}
