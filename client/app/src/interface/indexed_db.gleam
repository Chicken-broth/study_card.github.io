import core/category.{type Category}
import core/question.{type IdAndCategory}
import core/quiz_result.{type QuizResults}
import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/result

pub type DB {
  DB(
    db: Dynamic,
    data_set_list: List(String),
    data_set: String,
    name: String,
    version: Int,
  )
}

pub type Err =
  List(decode.DecodeError)

@external(javascript, "./indexedDB_ffi.mjs", "getDataSetName")
fn get_data_set_name_ffi() -> Dynamic

pub fn get_data_set_name() -> List(String) {
  get_data_set_name_ffi()
  |> decode.run(decode.list(decode.string))
  |> result.unwrap([])
}

/// IndexedDBデータベースを初期化します。
@external(javascript, "./indexedDB_ffi.mjs", "setup")
fn setup_ffi(name: String, version: Int, data_set: String) -> Promise(Dynamic)

pub fn setup(
  data_set_list: List(String),
  data_set: String,
  name: String,
  version: Int,
) -> Promise(DB) {
  setup_ffi(name, version, data_set)
  |> promise.map(fn(db) { DB(db, data_set_list, data_set, name, version) })
}

pub fn switch(db: DB, data_set: String) -> Promise(DB) {
  setup(db.data_set_list, data_set, db.name, db.version)
}

/// データベースからすべてのカテゴリを取得します。
/// `indexedDB_ffi.mjs`の`getCategories`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getCategories")
fn get_categories_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_categories(db: DB) -> Promise(Result(List(Category), Err)) {
  get_categories_ffi(db.db)
  |> promise.map(fn(dynamic) {
    decode.run(dynamic, decode.list(category.decoder()))
  })
}

/// データベースからすべての問題IDのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdList")
fn get_question_id_list_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_question_id_list(db: DB) -> Promise(Result(List(Int), Err)) {
  get_question_id_list_ffi(db.db)
  |> promise.map(fn(dynamic) { decode.run(dynamic, decode.list(decode.int)) })
}

/// IDを指定して特定の問題を取得します。
/// `indexedDB_ffi.mjs`の`getQuestionByIds`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionByIds")
fn get_question_by_ids_ffi(db: Dynamic, id: List(Int)) -> Promise(Dynamic)

pub fn get_question_by_ids(
  db: DB,
  id: List(Int),
) -> Promise(Result(List(question.Model), Err)) {
  get_question_by_ids_ffi(db.db, id)
  |> promise.map(fn(dynamic) {
    decode.run(dynamic, decode.list(question.decoder()))
  })
}

/// データベースからすべての問題のIDとカテゴリのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdAndCategoryList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdAndCategoryList")
fn get_question_id_and_category_list_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_question_id_and_category_list(
  db: DB,
) -> Promise(Result(List(IdAndCategory), Err)) {
  let decoder = {
    use id <- decode.field("id", decode.int)
    use category <- decode.field(
      "category",
      question.qusetion_category_decoder(),
    )
    decode.success(question.IdAndCategory(id, category))
  }
  get_question_id_and_category_list_ffi(db.db)
  |> promise.map(fn(dynamic) { decode.run(dynamic, decode.list(decoder)) })
}

/// 問題IDとカテゴリのペアを表す型
/// 取得した問題IDとカテゴリのリストをデコードします。
// pub fn decode_question_id_and_category_list(
//   dynamic: Dynamic,
// ) -> Result(List(IdAndCategory), Err) {
//   let id_and_category_decoder = {
//     use id <- decode.field("id", decode.int)
//     use category <- decode.field(
//       "category",
//       question.qusetion_category_decoder(),
//     )
//     decode.success(question.IdAndCategory(id, category))
//   }
//   decode.run(dynamic, decode.list(id_and_category_decoder))
// }

/// データベースにクイズ結果を保存します。
/// `indexedDB_ffi.mjs`の`saveQuizResult`に対応します。
/// 保存するresultオブジェクトはidを含まないdynamic型である必要があります。
@external(javascript, "./indexedDB_ffi.mjs", "saveQuizHistory")
fn save_quiz_history_ffi(db: Dynamic, results: json.Json) -> Promise(Dynamic)

pub fn save_quiz_history(
  db: DB,
  results: QuizResults,
) -> Promise(Result(Nil, Err)) {
  results
  |> quiz_result.to_json()
  |> save_quiz_history_ffi(db.db, _)
  |> promise.map(fn(_) { Ok(Nil) })
}

/// データベースからすべてのクイズ結果を取得します。
/// `indexedDB_ffi.mjs`の`getQuizResults`に対応します。
/// decoder はhistory.decode_quiz_historys
@external(javascript, "./indexedDB_ffi.mjs", "getQuizHistory")
fn get_quiz_historys_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_quiz_historys(db: DB) -> Promise(Result(QuizResults, Err)) {
  get_quiz_historys_ffi(db.db)
  |> promise.map(fn(dynamic) { decode.run(dynamic, quiz_result.decoder()) })
}
