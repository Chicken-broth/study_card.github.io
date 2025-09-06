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
    names: List(String),
    prefix: String,
    name: String,
    version: Int,
  )
}

pub fn init() -> DB {
  DB(db: dynamic.nil(), names: [], prefix: "", name: "", version: 0)
}

pub type Err {
  DecodeErr(List(decode.DecodeError))
  FFIError(String)
}

@external(javascript, "./indexedDB_ffi.mjs", "getDataSetName")
fn get_data_set_name_ffi() -> Dynamic

pub fn get_data_set_name() -> List(String) {
  get_data_set_name_ffi()
  |> decode.run(decode.list(decode.string))
  |> result.unwrap([])
}

/// IndexedDBデータベースを初期化します。
@external(javascript, "./indexedDB_ffi.mjs", "setup")
fn setup_ffi(prefix: String, name: String, version: Int) -> Promise(Dynamic)

pub fn setup(
  names: List(String),
  prefix: String,
  name: String,
  version: Int,
) -> Promise(DB) {
  setup_ffi(prefix, name, version)
  |> promise.map(fn(db) { DB(db, names, prefix, name, version) })
}

pub fn setup_from_db(db: DB) -> Promise(DB) {
  setup_ffi(db.prefix, db.name, db.version)
  |> promise.map(fn(dynamic) { DB(..db, db: dynamic) })
}

// pub fn switch(db: DB, name: String) -> Promise(DB) {
//   setup(db.names, db.prefix, name, db.version)
// }

/// データベースからすべてのカテゴリを取得します。
/// `indexedDB_ffi.mjs`の`getCategories`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getCategories")
fn get_categories_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_categories(db: DB) -> Promise(Result(List(Category), Err)) {
  get_categories_ffi(db.db)
  |> promise.map(fn(dynamic) {
    decode.run(dynamic, decode.list(category.decoder()))
    |> result.map_error(DecodeErr)
  })
}

/// データベースからすべての問題IDのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdList")
fn get_question_id_list_ffi(db: Dynamic) -> Promise(Dynamic)

pub fn get_question_id_list(db: DB) -> Promise(Result(List(Int), Err)) {
  get_question_id_list_ffi(db.db)
  |> promise.map(fn(dynamic) {
    decode.run(dynamic, decode.list(decode.int))
    |> result.map_error(DecodeErr)
  })
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
    |> result.map_error(DecodeErr)
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
  |> promise.map(fn(dynamic) {
    decode.run(dynamic, decode.list(decoder)) |> result.map_error(DecodeErr)
  })
}

//quiz resultsを取得します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuizResults")
fn get_quiz_results_ffi(db: Dynamic) -> Promise(Result(Dynamic, err))

pub fn get_quiz_results(db: DB) -> Promise(Result(QuizResults, Err)) {
  get_quiz_results_ffi(db.db)
  |> promise.map(fn(result) {
    case result {
      Ok(dynamic) ->
        decode.run(dynamic, quiz_result.decoder())
        |> result.map_error(DecodeErr)
      Error(_) -> FFIError("Error saving quiz results:  ") |> Error
    }
  })
}

//quiz_resultsを保存します
@external(javascript, "./indexedDB_ffi.mjs", "saveQuizResults")
fn save_quiz_results_ffi(
  db: Dynamic,
  results: json.Json,
) -> Promise(Result(ok, err))

pub fn save_quiz_results(
  db: DB,
  results: QuizResults,
) -> Promise(Result(Nil, Nil)) {
  results
  |> quiz_result.to_json()
  |> save_quiz_results_ffi(db.db, _)
  |> promise.map(fn(x) {
    case x {
      Ok(_) -> Ok(Nil)
      Error(_) -> Error(Nil)
    }
  })
}

@external(javascript, "../db/indexedDB_ffi.mjs", "resetQuizResults")
fn reset_quiz_results_ffi(db: Dynamic) -> Promise(Result(ok, err))

pub fn reset_quiz_results(db: DB) -> Promise(Result(QuizResults, Err)) {
  reset_quiz_results_ffi(db.db)
  |> promise.map(fn(result) {
    case result {
      Ok(dynamic) ->
        decode.run(dynamic, quiz_result.decoder())
        |> result.map_error(DecodeErr)
      Error(_) -> FFIError("Error saving quiz results:  ") |> Error
    }
  })
}
/// 問題IDとカテゴリのペアを表す型
/// 取得した問題IDとカテゴリのリストをデコードします。
/// データベースにクイズ結果を保存します。
/// `indexedDB_ffi.mjs`の`saveQuizResult`に対応します。
/// 保存するresultオブジェクトはidを含まないdynamic型である必要があります。
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
