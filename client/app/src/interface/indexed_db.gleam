import core/category.{type Category}
import core/question
import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/result

pub type DB

/// IndexedDBデータベースを初期化します。
/// `indexedDB_ffi.mjs`の`setup`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "setup")
pub fn setup(db_name: String, version: Int) -> Promise(DB)

/// データベースからすべてのカテゴリを取得します。
/// `indexedDB_ffi.mjs`の`getCategories`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getCategories")
pub fn get_categories(db: DB) -> Promise(Dynamic)

pub fn get_categories_decode(
  dynamic: Dynamic,
) -> Result(List(Category), json.DecodeError) {
  // echo dynamic
  decode.run(dynamic, decode.list(category.decoder()))
  |> result.map_error(json.UnableToDecode)
}

/// データベースから問題の総数を取得します。
/// `indexedDB_ffi.mjs`の`getQuestionCount`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionCount")
pub fn get_question_count(db: DB) -> Promise(Int)

/// データベースからすべての問題IDのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdList")
pub fn get_question_id_list(db: DB) -> Promise(Dynamic)

pub fn get_question_id_list_decode(
  dynamic: Dynamic,
) -> Result(List(Int), json.DecodeError) {
  decode.run(dynamic, decode.list(decode.int))
  |> result.map_error(json.UnableToDecode)
}

/// IDを指定して特定の問題を取得します。
/// `indexedDB_ffi.mjs`の`getQuestionByIds`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionByIds")
pub fn get_question_by_ids(db: DB, id: List(Int)) -> Promise(Dynamic)

pub fn get_question_by_ids_decode(
  dynamic: Dynamic,
) -> Result(List(question.Model), json.DecodeError) {
  decode.run(dynamic, decode.list(question.decoder()))
  |> result.map_error(json.UnableToDecode)
}

@external(javascript, "./indexedDB_ffi.mjs", "getQuestionById")
pub fn get_question_by_id(db: DB, id: Int) -> Promise(Dynamic)

pub fn get_question_by_id_decode(
  dynamic: Dynamic,
) -> Result(question.Model, json.DecodeError) {
  decode.run(dynamic, question.decoder())
  |> echo
  |> result.map_error(json.UnableToDecode)
}
