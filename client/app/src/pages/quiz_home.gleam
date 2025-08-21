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
import gleam/result
import interface/indexed_db.{type DB} as db
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event
import plinth/browser/dom_token_list

type ID =
  Int

/// Home画面のアプリケーションの状態を保持するモデル。
pub type Model {
  Model(
    db: DB,
    /// 利用可能なすべてのカテゴリのリスト。
    categories: List(Category),
    /// データベースから取得したすべての問題IDとカテゴリのリスト。
    question_id_categories: List(IdAndCategory),
    shuffle_or_not: Bool,
    /// ユーザーによって選択されたカテゴリのIDリスト。
    selected_category: List(SelectedCategory),
    /// ユーザーによって選択された問題数。
    selected_count: QuestionCount,
    selected_question_ids: List(Int),
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

pub type SelectedCategory {
  SelectedCategory(is_selected: Bool, category: Category)
}

pub type QuestionCount {
  Limit(Int)
  Full
}

/// アプリケーションのモデルを更新するためにディスパッチされるメッセージ。
pub type Msg {
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(ID, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(QuestionCount)
  SwitchShuffle(Bool)
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
      shuffle_or_not: True,
      selected_category: [],
      selected_question_ids: [],
      selected_count: Full,
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
    SelectCategory(id, is_selected) -> {
      let new_select_category: List(SelectedCategory) =
        list_.update_if(
          model.selected_category,
          fn(c) { c.category.id == id },
          fn(c) { SelectedCategory(is_selected, c.category) },
        )
      let new_question_ids: List(ID) =
        filtering_question_id(
          model.question_id_categories,
          new_select_category,
          model.selected_count,
          model.shuffle_or_not,
        )
      #(
        Model(
          ..model,
          selected_category: new_select_category,
          selected_question_ids: new_question_ids,
        ),
        effect.none(),
      )
    }
    SelectCount(quest_count) -> {
      let new_question_ids: List(ID) =
        filtering_question_id(
          model.question_id_categories,
          model.selected_category,
          quest_count,
          model.shuffle_or_not,
        )

      #(
        Model(
          ..model,
          selected_count: quest_count,
          selected_question_ids: new_question_ids,
        ),
        effect.none(),
      )
    }
    SwitchShuffle(is_shuffle) -> {
      #(Model(..model, shuffle_or_not: is_shuffle), effect.none())
    }
    StartQuiz -> {
      echo "Start Quiz"
      let eff =
        promise_.to_effect(
          db.get_question_by_ids(model.db, model.selected_question_ids),
          db.get_question_by_ids_decode,
          OutCome,
          ErrScreen,
        )
      #(model, eff)
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
      let new_selected_category =
        list.map(categories, SelectedCategory(True, _))

      #(
        Model(
          ..model,
          categories: categories,
          selected_category: new_selected_category,
          // loading: False,
        ),
        effect.none(),
      )
    }
    GetQuestionIdAndCategoryList(id_and_category_list) -> {
      echo "GetQuestionIdAndCategoryList"
      #(
        Model(
          ..model,
          question_id_categories: id_and_category_list,
          selected_question_ids: list.map(id_and_category_list, fn(x) { x.id }),
          // loading: False,
        ),
        effect.none(),
      )
    }
    GetQuizHistory(history) -> {
      echo "GetQuizHistory"
      // Update the model with the fetched history.
      #(Model(..model, history: history, loading: False), effect.none())
    }
    ErrScreen(json_err) -> {
      echo "err screen"
      #(Model(..model, error: Some(json_err)), effect.none())
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
  }
}

fn filtering_question_id(
  id_categorie_list: List(IdAndCategory),
  selected_category_ids: List(SelectedCategory),
  selected_count: QuestionCount,
  do_shuffle: Bool,
) -> List(ID) {
  //categoryのidリストを作成
  let filtered_category_ids: List(ID) =
    selected_category_ids
    |> list.filter(fn(c) { c.is_selected })
    |> list.map(fn(c) { c.category.id })
  //categoryでfilterしたquestionのidリストを作成
  let filtered_questions =
    id_categorie_list
    |> list.filter(fn(q) { list.contains(filtered_category_ids, q.category.id) })
    |> list.map(fn(c) { c.category.id })

  let limit_count = case selected_count {
    Limit(count) -> count
    Full -> list.length(filtered_questions)
  }
  case do_shuffle {
    True -> list.shuffle(filtered_questions)
    False -> filtered_questions
  }
  |> list.take(limit_count)
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

fn view_shuffle(shuffle: Bool) -> Element(Msg) {
  html.div([], [
    html.label([], [
      html.input([
        attr.type_("checkbox"),
        attr.checked(shuffle),
        event.on_check(fn(checked) { SwitchShuffle(checked) }),
      ]),
    ]),
  ])
}

/// カテゴリ選択UIをレンダリングする。
fn view_category_selection(
  selected_categories: List(SelectedCategory),
) -> Element(Msg) {
  html.div(
    [attr.styles([])],
    list.map(selected_categories, fn(c) {
      html.div([attr.styles([#("margin-right", "1rem")])], [
        html.input([
          attr.type_("checkbox"),
          attr.checked(c.is_selected),
          event.on_check(fn(checked) { SelectCategory(c.category.id, checked) }),
        ]),
        html.label([], [html.text(c.category.name)]),
      ])
    }),
  )
}

/// 問題数選択UIをレンダリングする。
fn view_count_selection(quest_count: QuestionCount) -> Element(Msg) {
  let counts = [Full, Limit(1), Limit(5), Limit(10), Limit(30), Limit(50)]
  let to_s = fn(count) {
    case count {
      Limit(i) -> int.to_string(i) <> "問"
      Full -> "all"
    }
  }
  html.div(
    [],
    list.map(counts, fn(count) {
      let is_selected = quest_count == count
      html.label([], [
        html.input([
          event.on_check(fn(_) { SelectCount(count) }),
          attr.type_("radio"),
          attr.name("count"),
          attr.value(to_s(count)),
          attr.checked(is_selected),
        ]),
        html.text(to_s(count)),
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
  let is_start_quiz_enabled = list.length(model.selected_question_ids) > 0
  // list.length(model.categories) > 0
  // && list.length(model.question_id_categories) > 0
  let qty = list.length(model.selected_question_ids)
  html.div([], [
    html.h1([], [html.text("Quiz App")]),
    view_error(model.error),
    html.h2([], [html.text("カテゴリ")]),
    view_category_selection(model.selected_category),
    html.h2([], [html.text("shuffle")]),
    view_shuffle(model.shuffle_or_not),
    html.h2([], [html.text("出題数選択")]),
    view_count_selection(model.selected_count),
    html.div([], [html.text("Loaded questions:" <> int.to_string(qty))]),
    view_actions(is_start_quiz_enabled, model.show_history, model.history),
    view_loading(model.loading),
  ])
}
