import core/category.{type Category}
import core/question.{type IdAndCategory}
import core/quiz_result.{type QuizResults}
import extra/list_
import extra/promise_
import gleam/bool
import gleam/function
import gleam/int
import gleam/io
import gleam/javascript/promise
import gleam/list
import gleam/option.{type Option, None, Some}
import interface/indexed_db.{type DB} as db
import lustre/attribute as attr
import lustre/effect.{type Effect}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

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
    /// 問題をシャッフルするかどうか。
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
    quiz_result: QuizResults,
    /// 履歴表示のON/OFFを切り替えるフラグ。
    show_results: Bool,
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
  SelectDb(String)
  DbChanged(DB)
  /// ユーザーがカテゴリのチェックボックスを操作した際に送信される。
  SelectCategory(ID, Bool)
  /// ユーザーが問題数を選択した際に送信される。
  SelectCount(QuestionCount)
  /// ユーザーがシャッフルのスイッチを操作した際に送信される。
  SwitchShuffle(Bool)
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
      shuffle_or_not: False,
      selected_category: [],
      selected_question_ids: [],
      selected_count: Full,
      loading: False,
      error: None,
      quiz_result: [],
      show_results: False,
    ),
    get_initial_data_effects(db),
  )
}

/// 受信したメッセージに基づいてモデルを更新し、新しい状態と副作用（Effect）を返す。
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    SelectDb(data_set_name) -> {
      let new_db = db.DB(..model.db, data_set: data_set_name)
      let setup_db_effect =
        db.switch(new_db, data_set_name)
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
      let new_question_ids: List(ID) =
        shuffle(model.selected_question_ids, is_shuffle)
      #(
        Model(
          ..model,
          selected_question_ids: new_question_ids,
          shuffle_or_not: is_shuffle,
        ),
        effect.none(),
      )
    }
    SWitchAllCategory(is_selected) -> {
      echo "SWitchAllCategory"
      let new_select_category: List(SelectedCategory) =
        list.map(model.selected_category, fn(c) {
          SelectedCategory(is_selected, c.category)
        })
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
    GetQuizHistory(quiz_result) -> {
      echo "GetQuizHistory"
      // Update the model with the fetched quiz_result.
      #(Model(..model, quiz_result: quiz_result, loading: False), effect.none())
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
  let filtered_questions: List(ID) =
    id_categorie_list
    |> list.filter(fn(q) { list.contains(filtered_category_ids, q.category.id) })
    |> list.map(fn(c) { c.id })
  // |> echo

  let limit_count = case selected_count {
    Limit(count) -> count
    Full -> list.length(filtered_questions)
  }
  shuffle(filtered_questions, do_shuffle)
  |> list.take(limit_count)
}

fn shuffle(xs: List(a), is_shuffle: Bool) -> List(a) {
  case is_shuffle {
    True -> list.shuffle(xs)
    False -> xs
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

fn view_shuffle(shuffle: Bool) -> Element(Msg) {
  html.div([section_container_style()], [
    view_checkbox_label(shuffle, "シャッフルする", SwitchShuffle),
  ])
}

fn view_checkbox_label(
  checked: Bool,
  label: String,
  handler: fn(Bool) -> Msg,
) -> Element(Msg) {
  html.label([attr.styles([#("cursor", "pointer")])], [
    html.input([
      attr.type_("checkbox"),
      attr.checked(checked),
      event.on_check(fn(checked) { handler(checked) }),
    ]),
    html.span([attr.styles([#("margin-left", "0.5rem")])], [html.text(label)]),
  ])
}

fn view_radio_with_label(
  checked: Bool,
  label: String,
  handler: fn(Bool) -> Msg,
) -> Element(Msg) {
  html.label([attr.styles([#("cursor", "pointer")])], [
    html.input([
      event.on_check(handler),
      attr.type_("radio"),
      attr.name("count"),
      attr.value(label),
      attr.checked(checked),
    ]),
    html.span([attr.styles([#("margin-left", "0.5rem")])], [html.text(label)]),
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
    list.map(model.selected_category, fn(c) { c.is_selected })
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
      view_db_selection(model.db.data_set_list, model.db.data_set),
    ]),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("カテゴリ")]),
    // view_all_category_selection(checked),
    view_category_selection(model.selected_category, checked),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("オプション")]),
    view_shuffle(model.shuffle_or_not),
    html.h2([attr.styles([#("margin-top", "1rem")])], [html.text("出題数選択")]),
    view_count_selection(model.selected_count),
    html.div([attr.styles([#("margin-top", "1rem")])], [
      html.text("選択中の問題数: " <> int.to_string(qty)),
    ]),
    view_actions(is_start_quiz_enabled),
    view_loading(model.loading),
    case model.show_results {
      True -> quiz_result.view(model.quiz_result)
      False -> html.text("")
    },
  ])
}
