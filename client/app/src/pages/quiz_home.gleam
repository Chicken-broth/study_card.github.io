import core/answer.{type History, Correct, Incorrect, NotAnswered}
import core/category.{type Category}
import core/question
import gleam/bool
import gleam/dict
import gleam/int
import gleam/io
import gleam/json
import gleam/list
import gleam/option.{type Option, None, Some}
import interface/indexed_db.{type DB} as db
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import utils/list_ex
import utils/promise_ex

/// Home画面のアプリケーションの状態を保持するモデル。
pub type Model {
  Model(
    db: DB,
    /// 利用可能なすべてのカテゴリのリスト。
    categories: List(Category),
    question_ids: List(Int),
    /// 問題のリスト。
    outcome: List(question.Model),
    /// ユーザーによって選択されたカテゴリのIDリスト。
    selected_category: Option(Category),
    /// ユーザーによって選択された問題数。
    selected_count: Int,
    /// データのロード中かどうかを示すフラグ。
    loading: Bool,
    /// 処理中に発生したエラーメッセージ。
    error: Option(json.DecodeError),
    history: History,
    show_history: Bool,
  )
}

/// アプリケーションのモデルを更新するためにディスパッチされるメッセージ。
pub type Msg {
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(Int, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(Int)
  /// クイズ開始ボタンがクリックされた際に送信される。
  StartQuiz
  /// 学習履歴ボタンがクリックされた際に送信される。
  ViewHistory
  GetCategories(List(Category))
  GetQuestionIds(List(Int))
  OutCome(List(question.Model))
  ErrScreen(json.DecodeError)
}

/// アプリケーションの初期状態を生成する。
pub fn init(db: DB, history: History) -> #(Model, Effect(Msg)) {
  let get_categories =
    promise_ex.to_effect(
      db.get_categories(db),
      db.get_categories_decode,
      GetCategories,
      ErrScreen,
    )

  let get_question_id_list =
    promise_ex.to_effect(
      db.get_question_id_list(db),
      db.get_question_id_list_decode,
      GetQuestionIds,
      ErrScreen,
    )

  let eff = effect.batch([get_categories, get_question_id_list])

  #(
    Model(
      db: db,
      categories: [],
      question_ids: [],
      outcome: [],
      selected_category: None,
      selected_count: 1,
      loading: False,
      error: None,
      history: history,
      show_history: False,
    ),
    eff,
  )
}

/// 受信したメッセージに基づいてモデルを更新し、新しい状態と副作用（Effect）を返す。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    SelectCategory(ind, is_selected) -> {
      let new_selected_category = case is_selected {
        True -> list_ex.get_at(model.categories, ind)
        False -> None
      }
      #(Model(..model, selected_category: new_selected_category), effect.none())
    }
    SelectCount(count) -> #(
      Model(..model, selected_count: count),
      effect.none(),
    )
    StartQuiz -> {
      echo "Start Quiz"
      let selected_ids =
        model.question_ids
        |> list.shuffle()
        |> list.take(model.selected_count)
      // |> echo

      let eff =
        promise_ex.to_effect(
          db.get_question_by_ids(model.db, selected_ids),
          db.get_question_by_ids_decode,
          OutCome,
          ErrScreen,
        )
      #(model, eff)
    }
    OutCome(questions) -> {
      // NOTE: This will overwrite the questions list. 
      // The UI will update to show the new questions.
      // A navigation to a new screen would be a better approach.
      io.println(
        "Fetched " <> int.to_string(list.length(questions)) <> " questions.",
      )
      #(model, effect.none())
    }
    ViewHistory -> {
      io.println("View History")
      #(
        Model(..model, show_history: bool.negate(model.show_history)),
        effect.none(),
      )
    }
    GetCategories(categories) -> {
      #(Model(..model, categories: categories), effect.none())
    }
    GetQuestionIds(ids) -> {
      #(
        Model(..model, question_ids: ids, history: answer.init(ids)),
        effect.none(),
      )
    }
    ErrScreen(json_err) -> {
      echo "err screen"
      #(Model(..model, error: Some(json_err)), effect.none())
    }
  }
}

// --- View Functions ---

fn view_error(error: Option(json.DecodeError)) -> Element(Msg) {
  case error {
    Some(_) -> html.p([attr.class("Loading error")], [])
    None -> html.text("")
  }
}

fn view_category_selection(
  categories: List(Category),
  selected_category: Option(Category),
) -> Element(Msg) {
  html.div(
    [attr.styles([#("display", "flex")])],
    list.index_map(categories, fn(category, ind) {
      let is_selected = case selected_category {
        Some(sc) -> sc.id == category.id
        None -> False
      }

      html.div([attr.styles([#("margin-right", "1rem")])], [
        html.input([
          attr.type_("checkbox"),
          // attr.checked(is_selected),
          // event.on_check(fn(checked) { SelectCategory(ind, checked) }),
          attr.checked(True),
        ]),
        html.label([], [html.text(category.name)]),
      ])
    }),
  )
}

fn view_count_selection(selected_count: Int) -> Element(Msg) {
  let counts = [1, 10, 20, 30]
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

fn view_actions(
  is_start_quiz_enabled: Bool,
  show_history: Bool,
  history: History,
) -> Element(Msg) {
  html.div([], [
    html.button(
      [
        event.on_click(StartQuiz),
        attr.disabled(bool.negate(is_start_quiz_enabled)),
      ],
      [html.text("クイズ開始")],
    ),
    html.button([event.on_click(ViewHistory)], [html.text("学習履歴")]),
    case show_history {
      True -> view_history(history)
      False -> html.text("")
    },
  ])
}

fn view_loading(loading: Bool) -> Element(Msg) {
  case loading {
    True -> html.p([], [html.text("Loading...")])
    False -> html.text("")
  }
}

//履歴を表示する
fn view_history(history: History) -> Element(Msg) {
  let history_list = dict.to_list(history)
  html.table([attr.class("history-table")], [
    html.thead([], [
      html.tr([], [
        html.th([], [html.text("ID")]),
        html.th([], [html.text("Result")]),
      ]),
    ]),
    html.tbody(
      [],
      list.map(history_list, fn(item) {
        let #(id, result) = item
        html.tr([], [
          html.td([], [html.text(int.to_string(id))]),
          html.td([], [
            case result {
              Correct -> html.text("○")
              Incorrect -> html.text("✖")
              NotAnswered -> html.text("-")
            },
          ]),
        ])
      }),
    ),
  ])
}

pub fn view(model: Model) -> Element(Msg) {
  // Enable start button only if categories and question IDs have been loaded.
  let is_start_quiz_enabled =
    list.length(model.categories) > 0 && list.length(model.question_ids) > 0

  html.div([], [
    html.h1([], [html.text("Quiz App")]),
    view_error(model.error),
    html.h2([], [html.text("カテゴリ")]),
    view_category_selection(model.categories, model.selected_category),
    html.h2([], [html.text("出題数選択")]),
    view_count_selection(model.selected_count),
    view_actions(is_start_quiz_enabled, model.show_history, model.history),
    view_loading(model.loading),
    // For debugging: show number of loaded questions
  // html.div([], [
  //   html.text(
  //     "Loaded questions: " <> int.to_string(list.length(model.outcome)),
  //   ),
  // ]),
  ])
}
