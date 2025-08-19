import core/answer.{type Answer, Correct, Incorrect, NotAnswered}
import gleam/dynamic/decode.{type Decoder}
import gleam/int
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import lustre/attribute as attr
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

//spec
/// 組み合わせ問題の実装
/// ユーザーは2列に並んだリストから、各列から1つづつPairを選び、正しい組み合わせを選ぶ
/// 
pub type Msg {
  SelectLeft(String)
  SelectRight(String)
}

pub type FocusState {
  Focused
  NotFocused
}

pub type MatchState {
  CorrectlyMatched
  IncorrectlyMatched
  NotYetMatched
}

pub type Item {
  Item(id: String, label: String, focus: FocusState, match: MatchState)
}

/// 組み合わせ問題のペア
pub type Pair {
  Pair(id: String, left: String, right: String)
}

pub type Model {
  Model(
    pairs: List(Pair),
    left: List(Item),
    right: List(Item),
    selected_left_id: Option(String),
    selected_right_id: Option(String),
    matched_pair_ids: List(String),
    answer: Answer,
  )
}

pub fn init(pairs: List(Pair)) -> Model {
  let left =
    list.map(pairs, fn(p) { Item(p.id, p.left, NotFocused, NotYetMatched) })
  let right =
    list.map(pairs, fn(p) { Item(p.id, p.right, NotFocused, NotYetMatched) })
  Model(pairs, left, right, None, None, [], NotAnswered)
}

/// すべてのアイテムのフォーカスを解除し、不正解の状態をリセットする
fn reset_item_states(items: List(Item)) -> List(Item) {
  list.map(items, fn(item) {
    let new_match_state = case item.match {
      IncorrectlyMatched -> NotYetMatched
      _ -> item.match
    }
    Item(..item, focus: NotFocused, match: new_match_state)
  })
}

/// 特定のアイテムのフォーカス状態を更新する
fn update_focus(
  items: List(Item),
  target_id: String,
  focus_state: FocusState,
) -> List(Item) {
  list.map(items, fn(item) {
    case item.id == target_id {
      True -> Item(..item, focus: focus_state)
      False -> item
    }
  })
}

/// 特定のアイテムのマッチ状態を更新する
fn update_match(
  items: List(Item),
  target_id: String,
  match_state: MatchState,
) -> List(Item) {
  list.map(items, fn(item) {
    case item.id == target_id {
      True -> Item(..item, match: match_state)
      False -> item
    }
  })
}

/// 両方のアイテムが選択されたときの状態を更新する
fn handle_pair_selection(
  model: Model,
  left_id: String,
  right_id: String,
) -> Model {
  let is_correct = left_id == right_id
  let new_match_state = case is_correct {
    True -> CorrectlyMatched
    False -> IncorrectlyMatched
  }

  // 両方のカラムのアイテムの状態を更新
  let new_left = update_match(model.left, left_id, new_match_state)
  let new_right = update_match(model.right, right_id, new_match_state)

  // フォーカスを解除
  let new_left = update_focus(new_left, left_id, NotFocused)
  let new_right = update_focus(new_right, right_id, NotFocused)

  let new_matched_pair_ids = case is_correct {
    True -> [left_id, ..model.matched_pair_ids]
    False -> model.matched_pair_ids
  }

  let new_model =
    Model(
      ..model,
      left: new_left,
      right: new_right,
      selected_left_id: None,
      selected_right_id: None,
      matched_pair_ids: new_matched_pair_ids,
    )

  Model(..new_model, answer: check_answer(new_model))
}

fn check_answer(model: Model) -> Answer {
  case is_quiz_complete(model) {
    True -> Correct
    False -> Incorrect
  }
}

fn is_quiz_complete(model: Model) -> Bool {
  list.length(model.matched_pair_ids) == list.length(model.pairs)
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    SelectLeft(left_id) -> {
      case model.selected_right_id {
        Some(right_id) -> handle_pair_selection(model, left_id, right_id)
        None -> {
          // 新しい選択を開始するため、両方のカラムの状態をリセット
          let reset_left = reset_item_states(model.left)
          let reset_right = reset_item_states(model.right)
          // 選択されたアイテムをフォーカス
          let new_left = update_focus(reset_left, left_id, Focused)
          Model(
            ..model,
            left: new_left,
            right: reset_right,
            selected_left_id: Some(left_id),
            selected_right_id: None,
          )
        }
      }
    }
    SelectRight(right_id) -> {
      case model.selected_left_id {
        Some(left_id) -> handle_pair_selection(model, left_id, right_id)
        None -> {
          // 新しい選択を開始するため、両方のカラムの状態をリセット
          let reset_left = reset_item_states(model.left)
          let reset_right = reset_item_states(model.right)
          // 選択されたアイテムをフォーカス
          let new_right = update_focus(reset_right, right_id, Focused)
          Model(
            ..model,
            left: reset_left,
            right: new_right,
            selected_right_id: Some(right_id),
            selected_left_id: None,
          )
        }
      }
    }
  }
}

/// アイテムの状態をインラインスタイルに変換する
fn item_styles(focus: FocusState, match: MatchState) -> List(#(String, String)) {
  let focus_style = case focus {
    Focused -> [#("border-color", "blue"), #("border-width", "2px")]
    NotFocused -> []
  }

  let match_style = case match {
    CorrectlyMatched -> [#("background-color", "#ddffdd")]
    IncorrectlyMatched -> [#("background-color", "#ffdddd")]
    NotYetMatched -> []
  }

  list.append(focus_style, match_style)
}

/// 左右どちらかのカラムを描画する
fn view_column(
  title: String,
  items: List(Item),
  on_select: fn(String) -> Msg,
) -> Element(Msg) {
  // 各カラムがフレックスコンテナ内で均等に広がるようにスタイルを設定
  let column_style = [#("flex", "1"), #("padding", "0 1em")]

  html.div([attr.styles(column_style)], [
    html.h3([], [html.text(title)]),
    html.ul(
      [attr.styles([#("padding-left", "0")])],
      list.map(items, fn(item) {
        let base_style = [
          #("border-radius", "8px"),
          #("padding", "10px"),
          #("margin-bottom", "5px"),
          #("border", "1px solid #ccc"),
          #("list-style-type", "none"),
        ]
        let dynamic_styles = item_styles(item.focus, item.match)
        let all_styles = list.append(base_style, dynamic_styles)
        html.li(
          [
            attr.styles(all_styles),
            case item.match {
              CorrectlyMatched -> attr.none()
              _ -> event.on_click(on_select(item.id))
            },
          ],
          [html.text(item.label)],
        )
      }),
    ),
  ])
}

/// クイズの進捗状況を描画する
fn view_progress(model: Model) -> Element(Msg) {
  html.p([], [
    html.text(
      "Answered: "
      <> int.to_string(list.length(model.matched_pair_ids))
      <> "/"
      <> int.to_string(list.length(model.pairs)),
    ),
  ])
}

/// クイズ完了メッセージを描画する
fn view_completion_message(model: Model) -> Element(Msg) {
  case is_quiz_complete(model) {
    True -> html.p([], [html.text("Quiz Complete!")])
    False -> html.text("")
  }
}

/// アイテムの状態をCSSクラス名に変換する
pub fn view(model: Model) -> Element(Msg) {
  // カラムを横並びにするためのフレックスコンテナ
  let container_style = [#("display", "flex")]

  html.div([], [
    html.div([attr.styles(container_style)], [
      view_column("left", model.left, SelectLeft),
      view_column("right", model.right, SelectRight),
    ]),
    view_progress(model),
    view_completion_message(model),
  ])
}

/// JSON に変換するのはPairリストのみ
pub fn to_json(model: Model) -> json.Json {
  json.array(model.pairs, fn(p) {
    json.object([
      #("id", json.string(p.id)),
      #("left", json.string(p.left)),
      #("right", json.string(p.right)),
    ])
  })
}

pub fn decoder() -> Decoder(Model) {
  let decode_pair =
    decode.list({
      use id <- decode.field("id", decode.string)
      use left <- decode.field("left", decode.string)
      use right <- decode.field("right", decode.string)
      decode.success(Pair(id:, left:, right:))
    })
  use pairs <- decode.then(decode_pair)
  pair_to_model(pairs)
  |> decode.success
}

fn pair_to_model(pairs: List(Pair)) -> Model {
  let left =
    list.map(pairs, fn(p) { Item(p.id, p.left, NotFocused, NotYetMatched) })
  let right =
    list.map(pairs, fn(p) { Item(p.id, p.right, NotFocused, NotYetMatched) })
  Model(pairs, left, right, None, None, [], NotAnswered)
}
