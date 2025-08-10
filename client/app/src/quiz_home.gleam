import category.{type Category}
import gleam/bool
import gleam/dynamic/decode
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/string
import lustre/attribute.{type Attribute} as attr
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import plinth/javascript/storage
import question

/// Home画面のアプリケーションの状態を保持するモデル。
pub type Model {
  Model(
    // storage: storage.Storage,
    /// 利用可能なすべてのカテゴリのリスト。
    categories: List(Category),
    /// 利用可能なすべての問題のリスト。
    questions: List(question.Model),
    /// ユーザーによって選択されたカテゴリのIDリスト。
    selected_categories: List(String),
    /// ユーザーによって選択された問題数。
    selected_count: Int,
    /// データのロード中かどうかを示すフラグ。
    loading: Bool,
    /// 処理中に発生したエラーメッセージ。
    error: Option(String),
  )
}

/// アプリケーションのモデルを更新するためにディスパッチされるメッセージ。
pub type Msg {
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(String, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(Int)
  /// クイズ開始ボタンがクリックされた際に送信される。
  StartQuiz
  /// 学習履歴ボタンがクリックされた際に送信される。
  ViewHistory
}

/// アプリケーションの初期状態を生成する。
/// ストレージからカテゴリと問題の初期データを読み込む。
/// データが存在しない場合はサンプルデータを生成してストレージに保存する。
pub fn init(storage: storage.Storage) -> #(Model, Effect(Msg)) {
  echo "categories"
  let categories = fetch_categories(storage) |> result.unwrap([])
  echo categories
  echo "questions"
  let questions = fetch_question(storage) |> result.unwrap([])
  echo list.length(questions)
  #(
    Model(
      // storage: storage,
      categories: categories,
      questions: questions,
      selected_categories: [],
      selected_count: 10,
      loading: False,
      error: None,
    ),
    none(),
  )
}

// カテゴリをフェッチするためのHTTPリクエストを作成
// let eff =
//   rsvp.get(
//     "http://localhost:3000/api/categories",
//     decode.list(types.decode_category())|>txt_handler(CategoriesFetched),
//   )
// HTTPリクエストを実行し、レスポンスを`CategoriesFetched`メッセージにマッピング

/// ローカルストレージからカテゴリのリストを取得する。
pub fn fetch_categories(storage: storage.Storage) -> Result(List(Category), Nil) {
  use categories_string <- result.try(storage.get_item(storage, "categories"))
  let decoder = decode.list(category.decoder())
  json.parse(categories_string, decoder)
  |> result.map_error(fn(err) {
    echo err
    Nil
  })
}

/// ローカルストレージから問題のリストを取得する。
pub fn fetch_question(
  storage: storage.Storage,
) -> Result(List(question.Model), Nil) {
  use question_string <- result.try(storage.get_item(storage, "question"))
  let decoder = decode.list(question.decoder())
  json.parse(question_string, decoder)
  |> result.map_error(fn(err) {
    echo err
    Nil
  })
}

/// 受信したメッセージに基づいてモデルを更新し、新しい状態と副作用（Effect）を返す。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    SelectCategory(category_id, is_selected) -> {
      // ユーザーの操作に基づいて選択されたカテゴリのリストを更新
      let new_selected_categories = case is_selected {
        True ->
          list.append(model.selected_categories, [category_id])
          |> list.unique
        False ->
          list.filter(model.selected_categories, fn(id) { id != category_id })
      }
      #(
        Model(..model, selected_categories: new_selected_categories),
        effect.none(),
      )
    }
    SelectCount(count) -> #(
      // 選択された問題数を更新
      Model(..model, selected_count: count),
      effect.none(),
    )
    StartQuiz -> {
      // 選択されたクイズパラメータをログに出力（現時点では）
      io.println(
        "Start Quiz with categories: "
        <> string.join(model.selected_categories, ", ")
        <> " and count: "
        <> int.to_string(model.selected_count),
      )
      #(model, effect.none())
    }
    ViewHistory -> {
      // 履歴表示アクションをログに出力（現時点では）
      io.println("View History")
      #(model, effect.none())
    }
  }
}

// --- View Functions ---

/// エラーメッセージを表示する
fn view_error(error: Option(String)) -> Element(Msg) {
  case error {
    Some(e) -> html.p(error_style(), [html.text("Error: " <> e)])
    None -> html.text("")
  }
}

/// カテゴリ選択のUIをレンダリングする
fn view_category_selection(
  categories: List(Category),
  selected_categories: List(String),
) -> Element(Msg) {
  html.div(
    [],
    list.map(categories, fn(category) {
      let checked = list.contains(selected_categories, category.id)
      html.label([], [
        html.input([
          event.on_check(fn(is_checked) {
            SelectCategory(category.id, is_checked)
          }),
          attr.type_("checkbox"),
          attr.name("category"),
          attr.value(category.id),
          attr.checked(checked),
        ]),
        html.text(category.name),
      ])
    }),
  )
}

/// 問題数選択のUIをレンダリングする
fn view_count_selection(selected_count: Int) -> Element(Msg) {
  let counts = [10, 20, 50]
  html.div(
    [],
    list.map(counts, fn(count) {
      let is_selected = selected_count == count
      html.label([], [
        html.input([
          event.on_check(fn(_) { SelectCount(count) }),
          attr.type_("radio"),
          attr.name("count"),
          attr.value(int.to_string(count)),
          attr.checked(is_selected),
        ]),
        html.text(int.to_string(count) <> "問"),
      ])
    }),
  )
}

/// アクションボタンをレンダリングする
fn view_actions(is_start_quiz_enabled: Bool) -> Element(Msg) {
  html.div([], [
    html.button(
      [
        event.on_click(StartQuiz),
        attr.disabled(bool.negate(is_start_quiz_enabled)),
      ],
      [html.text("クイズ開始")],
    ),
    html.button([event.on_click(ViewHistory)], [html.text("学習履歴")]),
  ])
}

/// ローディングインジケータを表示する
fn view_loading(loading: Bool) -> Element(Msg) {
  case loading {
    True -> html.p([], [html.text("Loading...")])
    False -> html.text("")
  }
}

/// 現在のModelに基づいてHome画面のUIをレンダリングする
pub fn view(model: Model) -> Element(Msg) {
  let is_start_quiz_enabled = list.length(model.selected_categories) > 0

  html.div([], [
    html.h1([], [html.text("Quiz App")]),
    view_error(model.error),
    html.h2([], [html.text("カテゴリ選択")]),
    view_category_selection(model.categories, model.selected_categories),
    html.h2([], [html.text("出題数選択")]),
    view_count_selection(model.selected_count),
    view_actions(is_start_quiz_enabled),
    view_loading(model.loading),
  ])
}

// pub fn main() {
//   let app = lustre.application(init, update, view)
//   let assert Ok(_) = lustre.start(app, "#app", Nil)

//   Nil
// }

// --- Style Functions ---

fn error_style() -> List(Attribute(Msg)) {
  [attr.class("error")]
}
