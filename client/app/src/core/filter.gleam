import core/category.{type Category}
import core/question.{type IdAndCategory}
import core/quiz_result.{type QuizResults}
import gleam/bool
import gleam/list

// import pages/types.{type QuestionCount, type SelectedCategory}

pub type ID =
  Int

pub type SelectedCategory {
  SelectedCategory(is_selected: Bool, category: Category)
}

pub type QuestionCount {
  Limit(Int)
  Full
}

/// クイズの問題をフィルタリングするためのオプション。
pub type FilterOptions {
  FilterOptions(
    selected_categories: List(SelectedCategory),
    selected_count: QuestionCount,
    do_shuffle: Bool,
    quiz_results: QuizResults,
    unanswered_only: Bool,
  )
}

/// FilterOptionsのデフォルト値を生成する。
pub fn default_options() -> FilterOptions {
  FilterOptions(
    selected_categories: [],
    selected_count: Full,
    do_shuffle: False,
    quiz_results: [],
    unanswered_only: False,
  )
}

/// 選択されたカテゴリに基づいて問題IDをフィルタリングする。
fn filter_by_category(
  all_questions: List(IdAndCategory),
  selected_categories: List(SelectedCategory),
) -> List(ID) {
  let selected_category_ids =
    selected_categories
    |> list.filter(fn(c) { c.is_selected })
    |> list.map(fn(c) { c.category.id })

  all_questions
  |> list.filter(fn(q) { list.contains(selected_category_ids, q.category.id) })
  |> list.map(fn(q) { q.id })
}

/// 未回答の問題のみをフィルタリングする。
fn filter_unanswered(
  question_ids: List(ID),
  quiz_results: QuizResults,
  unanswered_only: Bool,
) -> List(ID) {
  use <- bool.guard(bool.negate(unanswered_only), question_ids)
  let answered_ids =
    quiz_result.filter_exist_answers(quiz_results)
    |> list.map(fn(r) { r.id })

  list.filter(question_ids, fn(id) {
    list.contains(answered_ids, id) |> bool.negate
  })
}

/// シャッフルと出題数の制限を適用する。
fn apply_count_and_shuffle(
  question_ids: List(ID),
  selected_count: QuestionCount,
  do_shuffle: Bool,
) -> List(ID) {
  let shuffled_ids = shuffle(question_ids, do_shuffle)
  let limit_count = case selected_count {
    Limit(count) -> count
    Full -> list.length(shuffled_ids)
  }
  list.take(shuffled_ids, limit_count)
}

/// リストをシャッフルするかどうかを決定する。
fn shuffle(xs: List(a), is_shuffle: Bool) -> List(a) {
  case is_shuffle {
    True -> list.shuffle(xs)
    False -> xs
  }
}

/// 複数の条件に基づいて問題IDをフィルタリングするパイプライン。
pub fn filter_question_ids(
  all_questions: List(IdAndCategory),
  options: FilterOptions,
) -> List(ID) {
  all_questions
  |> filter_by_category(options.selected_categories)
  |> filter_unanswered(options.quiz_results, options.unanswered_only)
  |> apply_count_and_shuffle(options.selected_count, options.do_shuffle)
}
