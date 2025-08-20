import core/answer.{Correct, Incorrect, NotAnswered}
import core/category.{type Category}
import core/history.{type History}
import core/question.{type IdAndCategory}
import extra/list_
import extra/promise_
import gleam/bool
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import interface/indexed_db.{type DB} as db
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

/// Home画面のアプリケーションの状態を保持するモデル。
pub type Model {
  Model(
    db: DB,
    /// 利用可能なすべてのカテゴリのリスト。
    categories: List(Category),
    /// データベースから取得したすべての問題IDとカテゴリのリスト。
    question_id_categories: List(IdAndCategory),
    /// クイズの結果として表示される問題のリスト。
    outcome: List(question.Model),
    /// ユーザーによって選択されたカテゴリのIDリスト。
    selected_category: Option(Category),
    /// ユーザーによって選択された問題数。
    selected_count: Int,
    /// データのロード中かどうかを示すフラグ。
    loading: Bool,
    /// 処理中に発生したエラーメッセージ。
    error: Option(db.Err),
    /// ユーザーの学習履歴。
    history: History,
    /// 履歴表示のON/OFFを切り替えるフラグ。
    show_history: Bool,
  )
}

/// アプリケーションのモデルを更新するためにディスパッチされるメッセージ。
pub type Msg {
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(Int, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(Int)
  /// 学習履歴ボタンがクリックされた際に送信される。
  ViewHistory
  /// カテゴリのリストが取得された際に送信される。
  GetCategories(List(Category))
  /// 問題IDのリストが取得された際に送信される。
  GetQuestionIdAndCategoryList(List(IdAndCategory))
  /// 学習記録が取得された
  GetQuizHistory(History)
  /// クイズ開始ボタンがクリックされた際に送信される。
  StartQuiz
  /// クイズの結果（問題リスト）が取得された際に送信される。
  OutCome(List(question.Model))
  /// エラーが発生した際に送信される。
  ErrScreen(db.Err)
}

/// アプリケーションの初期状態を生成する。
/// データベースからカテゴリと問題IDのリストを非同期で取得する。
pub fn init(db: DB) -> #(Model, Effect(Msg)) {
  let get_categories =
    promise_.to_effect(
      db.get_categories(db),
      db.get_categories_decode,
      GetCategories,
      ErrScreen,
    )

  let get_question_id_and_category_list =
    promise_.to_effect(
      db.get_question_id_and_category_list(db),
      db.decode_question_id_and_category_list,
      GetQuestionIdAndCategoryList,
      ErrScreen,
    )

  let get_history =
    promise_.to_effect(
      db.get_quiz_historys(db),
      db.decode_quiz_historys,
      GetQuizHistory,
      ErrScreen,
    )

  #(
    Model(
      db: db,
      categories: [],
      question_id_categories: [],
      outcome: [],
      selected_category: None,
      selected_count: 1,
      loading: False,
      error: None,
      history: [],
      show_history: False,
    ),
    effect.batch([
      get_categories,
      get_question_id_and_category_list,
      get_history,
    ]),
  )
}

/// 受信したメッセージに基づいてモデルを更新し、新しい状態と副作用（Effect）を返す。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    SelectCategory(ind, is_selected) -> {
      let new_selected_category = case is_selected {
        True -> list_.get_at(model.categories, ind)
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
      let all_question_ids =
        model.question_id_categories
        |> list.map(fn(item) { item.id })
      let selected_ids =
        all_question_ids
        |> list.shuffle()
        |> list.take(model.selected_count)
      // |> echo

      let eff =
        promise_.to_effect(
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
      echo "View History"
      #(
        Model(..model, show_history: bool.negate(model.show_history)),
        effect.none(),
      )
    }
    GetCategories(categories) -> {
      echo "GetCategories"
      #(Model(..model, categories: categories), effect.none())
    }
    GetQuestionIdAndCategoryList(id_and_category_list) -> {
      // let history = history.from_id_category(id_and_category_list)
      // let save_history =
      //   history
      //   |> history.to_json
      //   |> db.save_quiz_history(model.db, _)
      //   |> promise_.to_effect_no_decode(fn(_) { SaveQuizHistory })
      echo "GetQuestionIdAndCategoryList"
      #(
        Model(..model, question_id_categories: id_and_category_list),
        effect.none(),
      )
    }
    GetQuizHistory(history) -> {
      echo "GetQuizHistory"
      // Update the model with the fetched history.
      #(Model(..model, history: history), effect.none())
    }
    ErrScreen(json_err) -> {
      echo "err screen"
      #(Model(..model, error: Some(json_err)), effect.none())
    }
  }
}

/// カテゴリ選択の更新。
/// 問題数選択の更新。
/// クイズ開始処理。選択された問題数に基づいて問題IDをシャッフルし、データベースから問題を取得する。
/// 取得した問題リストでモデルを更新する。
/// 履歴表示のON/OFFを切り替える。
/// 取得したカテゴリリストでモデルを更新する。
/// 取得した問題IDリストでモデルを更新し、履歴を初期化する。
/// エラーメッセージでモデルを更新する。
// --- View Functions ---

/// エラーメッセージを表示する。
fn view_error(error: Option(db.Err)) -> Element(Msg) {
  case error {
    Some(_) -> html.p([attr.class("Loading error")], [])
    None -> html.text("")
  }
}

/// カテゴリ選択UIをレンダリングする。
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

/// 問題数選択UIをレンダリングする。
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

/// アクションボタン（クイズ開始、学習履歴）をレンダリングする。
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

/// ローディングメッセージを表示する。
fn view_loading(loading: Bool) -> Element(Msg) {
  case loading {
    True -> html.p([], [html.text("Loading...")])
    False -> html.text("")
  }
}

/// ユーザーの学習履歴を表示するテーブルをレンダリングする。
fn view_history(history: History) -> Element(Msg) {
  html.table([attr.class("history-table")], [
    html.thead([], [
      html.tr([], [
        html.th([], [html.text("ID")]),
        html.th([], [html.text("Category")]),
        html.th([], [html.text("Result")]),
      ]),
    ]),
    html.tbody(
      [],
      list.map(history, fn(h) {
        html.tr([], [
          html.td([], [html.text(int.to_string(h.id))]),
          html.td([], [html.text(h.category.name)]),
          html.td([], [
            case h.answer {
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

/// アプリケーションのメインビューをレンダリングする。
pub fn view(model: Model) -> Element(Msg) {
  // カテゴリと問題IDがロードされている場合にのみクイズ開始ボタンを有効にする。
  let is_start_quiz_enabled =
    list.length(model.categories) > 0
    && list.length(model.question_id_categories) > 0

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
