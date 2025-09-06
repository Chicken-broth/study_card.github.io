import core/category.{type Category}
import core/filter.{
  type FilterOptions, type ID, type QuestionCount, type SelectedCategory,
  FilterOptions, Full, Limit, SelectedCategory,
}
import core/question.{type IdAndCategory}
import core/quiz_result.{type QuizResults}
import db/indexed_db.{type DB} as db
import extra/list_
import extra/promise_
import gleam/bool
import gleam/function
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
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
    /// フィルタリングオプション
    filter_options: FilterOptions,
    /// 選択されたカテゴリと出題数に基づいてフィルタリングされた問題IDのリスト。
    selected_question_ids: List(Int),
    /// データのロード中かどうかを示すフラグ。
    loading: Bool,
    /// 処理中に発生したエラーメッセージ。
    error: Option(db.Err),
    /// 履歴表示のON/OFFを切り替えるフラグ。
    show_results: Bool,
  )
}

/// アプリケーションのモデルを更新するためにディスパッチされるメッセージ。
pub type Msg {
  SelectDb(String)
  DbChanged(DB)
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(ID, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(QuestionCount)
  /// ユーザーがシャッフルのスイッチを操作した際に送信される。
  SwitchShuffle(Bool)
  /// 「未回答の問題のみ」フィルターのスイッチを操作した際に送信される。
  SwitchUnansweredOnly(Bool)
  ///カテゴリを全部選択にするか全部選択なしにするかの切り替えボタンがクリックされた際に送信される。
  SWitchAllCategory(Bool)
  /// 学習履歴ボタンがクリックされた際に送信される。
  ViewResults
  /// カテゴリのリストが取得された際に送信される。
  GetCategories(List(Category))
  /// 問題IDのリストが取得された際に送信される。
  GetQuestionIdAndCategoryList(List(IdAndCategory))
  /// 学習記録が取得された
  GetQuizHistory(QuizResults)
  /// クイズ開始ボタンがクリックされた際に送信される。
  StartQuiz
  /// クイズの結果（問題リスト）が取得された際に送信される。
  OutCome(List(question.Model))
  /// エラーが発生した際に送信される。
  ErrScreen(db.Err)
}

fn get_initial_data_effects(db: DB) -> Effect(Msg) {
  let get_categories =
    db.get_categories(db)
    |> promise_.to_effect(GetCategories, ErrScreen)

  let get_question_id_and_category_list =
    db.get_question_id_and_category_list(db)
    |> promise_.to_effect(GetQuestionIdAndCategoryList, ErrScreen)

  let get_results =
    db.get_quiz_results(db)
    |> promise_.to_effect(GetQuizHistory, ErrScreen)
  echo "get_initial_data_effects"
  effect.batch([get_categories, get_question_id_and_category_list, get_results])
}

/// アプリケーションの初期状態を生成する。
/// データベースからカテゴリと問題IDのリストを非同期で取得する。
pub fn init(db: DB) -> #(Model, Effect(Msg)) {
  #(
    Model(
      db: db,
      categories: [],
      question_id_categories: [],
      filter_options: filter.default_options(),
      selected_question_ids: [],
      loading: False,
      error: None,
      show_results: False,
    ),
    get_initial_data_effects(db),
  )
}

/// フィルタリングオプションに基づいて問題IDリストを更新するヘルパー関数。
fn update_filtered_questions(model: Model) -> Model {
  let new_question_ids =
    filter.filter_question_ids(
      model.question_id_categories,
      model.filter_options,
    )
  Model(..model, selected_question_ids: new_question_ids)
}

/// 受信したメッセージに基づいてモデルを更新し、新しい状態と副作用（Effect）を返す。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    SelectDb(name) -> {
      let new_db = db.DB(..model.db, name: name)
      let setup_db_effect =
        new_db
        |> db.setup_from_db
        |> promise_.to_effect_simple(DbChanged)

      #(Model(..model, db: new_db, loading: True), setup_db_effect)
    }
    DbChanged(new_db) -> {
      #(
        Model(..model, db: new_db, loading: False),
        get_initial_data_effects(new_db),
      )
    }
    SelectCategory(id, is_selected) -> {
      let new_select_category: List(SelectedCategory) =
        list_.update_if(
          model.filter_options.selected_categories,
          fn(c) { c.category.id == id },
          fn(c) { SelectedCategory(is_selected, c.category) },
        )
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            selected_categories: new_select_category,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    SelectCount(quest_count) -> {
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            selected_count: quest_count,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    SwitchShuffle(is_shuffle) -> {
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            do_shuffle: is_shuffle,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    SwitchUnansweredOnly(is_unanswered_only) -> {
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            unanswered_only: is_unanswered_only,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }

    SWitchAllCategory(is_selected) -> {
      echo "SWitchAllCategory"
      let new_select_category: List(SelectedCategory) =
        list.map(model.filter_options.selected_categories, fn(c) {
          SelectedCategory(is_selected, c.category)
        })
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            selected_categories: new_select_category,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    ViewResults -> {
      echo "View History"
      #(
        Model(..model, show_results: bool.negate(model.show_results)),
        effect.none(),
      )
    }
    GetCategories(categories) -> {
      echo "GetCategories"
      let new_selected_category =
        list.map(categories, SelectedCategory(True, _))

      let new_model =
        Model(
          ..model,
          categories: categories,
          filter_options: FilterOptions(
            ..model.filter_options,
            selected_categories: new_selected_category,
          ),
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    GetQuestionIdAndCategoryList(id_and_category_list) -> {
      echo "GetQuestionIdAndCategoryList"
      let new_model =
        Model(..model, question_id_categories: id_and_category_list)
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    GetQuizHistory(quiz_result) -> {
      echo "GetQuizHistory"
      // Update the model with the fetched quiz_result.
      // 学習履歴が更新されたので、問題リストも再フィルタリングする
      let new_model =
        Model(
          ..model,
          filter_options: FilterOptions(
            ..model.filter_options,
            quiz_results: quiz_result,
          ),
          loading: False,
        )
        |> update_filtered_questions
      #(new_model, effect.none())
    }
    ErrScreen(json_err) -> {
      echo "err screen"
      #(Model(..model, error: Some(json_err)), effect.none())
    }
    StartQuiz -> {
      echo "Start Quiz"
      let eff =
        db.get_question_by_ids(model.db, model.selected_question_ids)
        |> promise_.to_effect(OutCome, ErrScreen)
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

// style関数
//　背景は灰色、丸角、縦並び
fn section_container_style() {
  attr.styles([
    #("display", "inline-flex"),
    #("flex-direction", "column"),
    #("padding", "0.5rem"),
    #("border-radius", "0.5rem"),
    #("background-color", "#f0f0f0"),
  ])
}

//横並び
fn section_container_row_style() {
  attr.styles([
    #("display", "inline-flex"),
    #("padding", "0.5rem"),
    #("border-radius", "0.5rem"),
    #("background-color", "#f0f0f0"),
  ])
}

fn view_options(shuffle: Bool, unanswered_only: Bool) -> Element(Msg) {
  html.div([section_container_row_style()], [
    view_checkbox_label(shuffle, "シャッフルする", SwitchShuffle),
    view_checkbox_label(unanswered_only, "未回答の問題のみ", SwitchUnansweredOnly),
  ])
}

/// ラベルの左側に余白を追加するスタイル。
fn style_margin_left_1() -> attr.Attribute(msg) {
  attr.style("margin-left", "1rem")
}

fn style_cursor_pointer() -> attr.Attribute(msg) {
  attr.style("cursor", "pointer")
}

fn view_checkbox_label(
  checked: Bool,
  label: String,
  handler: fn(Bool) -> Msg,
) -> Element(Msg) {
  html.label([style_margin_left_1(), style_cursor_pointer()], [
    html.input([
      attr.type_("checkbox"),
      attr.checked(checked),
      event.on_check(fn(checked) { handler(checked) }),
    ]),
    html.span([style_cursor_pointer()], [html.text(label)]),
  ])
}

fn view_radio_with_label(
  checked: Bool,
  label: String,
  handler: fn(Bool) -> Msg,
) -> Element(Msg) {
  html.label([style_margin_left_1(), style_cursor_pointer()], [
    html.input([
      event.on_check(handler),
      attr.type_("radio"),
      attr.name("count"),
      attr.value(label),
      attr.checked(checked),
    ]),
    html.span([], [html.text(label)]),
  ])
}

fn view_category_selection(
  selected_categories: List(SelectedCategory),
  checked: Bool,
) -> Element(Msg) {
  html.div([section_container_style()], [
    view_checkbox_label(checked, "switch all select", SWitchAllCategory),
    //ボーダーラインを追加
    html.hr([
      attr.styles([#("border", "1px solid #ccc"), #("margin", "0.5rem 0")]),
    ]),
    html.div(
      [
        attr.styles([
          #("display", "flex"),
          #("flex-direction", "column"),
          #("margin-left", "1rem"),
        ]),
      ],
      list.map(selected_categories, fn(c) {
        view_checkbox_label(c.is_selected, c.category.name, SelectCategory(
          c.category.id,
          _,
        ))
      }),
    ),
  ])
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
    [section_container_row_style()],
    list.map(counts, fn(count) {
      let is_selected = quest_count == count
      view_radio_with_label(is_selected, to_s(count), fn(_) {
        SelectCount(count)
      })
    }),
  )
}

/// アクションボタン（クイズ開始、学習履歴）をレンダリングする。
fn view_actions(is_start_quiz_enabled: Bool) -> Element(Msg) {
  let button_style = fn(is_primary) {
    [
      attr.styles([
        #("padding", "0.5rem 1rem"),
        #("border", "none"),
        #("border-radius", "0.5rem"),
        // #("color", "white"),
        // #("font-weight", "bold"),
        #("color", case is_primary {
          True -> "#393944ff"
          //黒
          False -> "#6c757d"
        }),
        #("box-shadow", "0 2px 4px rgba(0, 0, 0, 0.1"),
        #("transition", "background-color 0.2s ease"),
      ]),
    ]
  }
  html.div(
    [
      attr.styles([
        // #("margin-right", "1rem"),
        #("display", "flex"),
        #("gap", "1rem"),
      ]),
    ],
    [
      html.button(
        [
          event.on_click(StartQuiz),
          attr.disabled(bool.negate(is_start_quiz_enabled)),
        ]
          |> list.append(button_style(is_start_quiz_enabled)),
        [html.text("クイズ開始")],
      ),
      html.button(
        [event.on_click(ViewResults)] |> list.append(button_style(True)),
        [html.text("学習履歴")],
      ),
    ],
  )
}

/// ローディングメッセージを表示する。
fn view_loading(loading: Bool) -> Element(Msg) {
  case loading {
    True -> html.p([], [html.text("Loading...")])
    False -> html.text("")
  }
}

fn view_db_selection(
  data_set_list: List(String),
  selected_db: String,
) -> Element(Msg) {
  html.div([section_container_row_style()], [
    html.select(
      [event.on_change(SelectDb)],
      list.map(data_set_list, fn(data_set_name) {
        html.option(
          [
            attr.value(data_set_name),
            attr.selected(data_set_name == selected_db),
          ],
          data_set_name,
        )
      }),
    ),
  ])
}

/// アプリケーションのメインビューをレンダリングする。
pub fn view(model: Model) -> Element(Msg) {
  // カテゴリと問題IDがロードされている場合にのみクイズ開始ボタンを有効にする。
  let is_start_quiz_enabled = list.length(model.selected_question_ids) > 0
  let checked =
    model.filter_options.selected_categories
    |> list.map(fn(c) { c.is_selected })
    |> list.any(function.identity)
  let qty = list.length(model.selected_question_ids)
  html.div([], [
    html.h1([attr.styles([#("text-align", "center")])], [html.text("Quiz App")]),
    view_error(model.error),
    html.div([attr.styles([#("display", "flex"), #("align-items", "center")])], [
      html.h2(
        [attr.styles([#("margin-right", "1rem"), #("font-size", "1.17em")])],
        [html.text("問題集選択")],
      ),
      view_db_selection(model.db.names, model.db.name),
    ]),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("カテゴリ")]),
    // view_all_category_selection(checked),
    view_category_selection(model.filter_options.selected_categories, checked),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("オプション")]),
    view_options(
      model.filter_options.do_shuffle,
      model.filter_options.unanswered_only,
    ),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("出題数選択")]),
    view_count_selection(model.filter_options.selected_count),
    html.div([attr.styles([#("margin-top", "1rem")])], [
      html.text("選択中の問題数: " <> int.to_string(qty)),
    ]),
    view_actions(is_start_quiz_enabled),
    view_loading(model.loading),
    case model.show_results {
      True -> quiz_result.view(model.filter_options.quiz_results)
      False -> html.text("")
    },
  ])
}
