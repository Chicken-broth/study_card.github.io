import core/category
import core/question
import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json
import gleam/result

import extra/json_

pub type DB

/// このモジュール内で発生する可能性のあるエラーを表す型。
pub type Err {
  /// JavaScript FFI呼び出しからのエラー。
  ExternalErr(String)
  /// JSONのデコードエラー。
  JsonDecodeError(json.DecodeError)
  /// Dynamic値からGleamの型へのデコードエラー。
  DecodeError(List(decode.DecodeError))
}

@external(javascript, "./indexedDB_ffi.mjs", "setup")
pub fn setup(db_name: String, version: Int) -> Promise(DB)

@external(javascript, "./firestore_ffi.mjs", "getCategories")
fn get_categories_dynamic(db: DB) -> Promise(Dynamic)

@external(javascript, "./firestore_ffi.mjs", "getQuestionCount")
pub fn get_question_count(db: DB) -> Promise(Int)

@external(javascript, "./firestore_ffi.mjs", "getQuestionById")
fn get_question_by_id_dynamic(db: DB, id: Int) -> Promise(Dynamic)

pub fn get_category(db: DB) -> Promise(Result(List(category.Category), String)) {
  let promise = get_categories_dynamic(db)
  use dynamic <- promise.map(promise)
  decode.run(dynamic, decode.list(category.decoder()))
  |> result.map_error(json_.errs_to_string)
}

pub fn get_question_by_id(
  db: DB,
  id: Int,
) -> Promise(Result(question.Model, String)) {
  let promise = get_question_by_id_dynamic(db, id)
  use dynamic <- promise.map(promise)
  decode.run(dynamic, question.decoder())
  |> result.map_error(json_.errs_to_string)
}
/// Promiseが返すResultのエラー型を、このモジュールで定義された`Err`型に変換するヘルパー関数。
// @external(javascript, "./firestore_ffi.mjs", "getCollection")
// fn get_collection_raw(path: String) -> Promise(Result(Dynamic, String))

// @external(javascript, "./firestore_ffi.mjs", "getDocument")
// fn get_document_raw(
//   path: String,
//   id: String,
// ) -> Promise(Result(Dynamic, String))

// @external(javascript, "./firestore_ffi.mjs", "addDocument")
// fn add_document_raw(
//   path: String,
//   json: json.Json,
// ) -> Promise(Result(Dynamic, String))

// @external(javascript, "./firestore_ffi.mjs", "initializeAndGetCachedData")
// fn initialize_and_get_cached_data_raw() -> Promise(Result(Dynamic, String))

// /// RestAPIから
// // const base_url = "https://firestore.googleapis.com"

// pub fn get_category_question(
//   success: fn(category.Category) -> msg,
//   failed: fn(rsvp.Error) -> msg,
// ) -> rsvp.Handler(msg) {
//   use result_string <- rsvp.expect_json(category.decoder())
//   case result_string {
//     Ok(cat) -> success(cat)
//     Error(err) -> failed(err)
//   }
//   |> echo
// }

// pub fn get_question_question(
//   success: fn(question.Model) -> msg,
//   failed: fn(rsvp.Error) -> msg,
// ) -> rsvp.Handler(msg) {
//   use result_string <- rsvp.expect_json(question.decoder())
//   echo result_string
//   case result_string {
//     Ok(question) -> success(question)
//     Error(err) -> failed(err)
//   }
// }

// /// キャッシュされたカテゴリと質問のデータを表す型。
// pub type CachedData {
//   CachedData(
//     categories: List(category.Category),
//     questions: List(question.Model),
//   )
// }

// fn promise_wrap_err(
//   res: Promise(Result(a, err)),
//   to: fn(err) -> Err,
// ) -> Promise(Result(a, Err)) {
//   use result <- promise.map(res)
//   use err <- result.map_error(result)
//   to(err)
// }

// /// 指定されたパスのコレクションからすべてのドキュメントを取得し、
// /// それらをGleamの値のリストにデコードします。
// pub fn get_collection(
//   path: String,
//   decoder: Decoder(a),
// ) -> Promise(Result(List(a), Err)) {
//   let get_result_promise =
//     get_collection_raw(path) |> promise_wrap_err(ExternalErr)
//   use result_string <- promise.map(get_result_promise)
//   use dyn <- result.try(result_string)
//   decode.run(dyn, decode.list(decoder))
//   |> result.map_error(DecodeError)
// }

// /// 自動生成されたIDで新しいドキュメントをコレクションに追加します。
// /// 提供されたGleamの値は、送信前にJSONにエンコードされます。
// pub fn add_document(
//   path: String,
//   json: json.Json,
// ) -> Promise(Result(String, Err)) {
//   let promise_result =
//     add_document_raw(path, json) |> promise_wrap_err(ExternalErr)
//   use result <- promise.map(promise_result)
//   use dyn <- result.try(result)
//   decode.run(dyn, decode.string)
//   |> result.map_error(DecodeError)
// }

// /// アプリケーションの初期化時にFirestoreからデータを取得し、Local Storageにキャッシュします。
// /// キャッシュが存在する場合はLocal Storageからデータをロードします。
// pub fn initialize_and_get_cached_data() -> Promise(Result(CachedData, Err)) {
//   let init_result_promise =
//     initialize_and_get_cached_data_raw() |> promise_wrap_err(ExternalErr)
//   use result <- promise.map(init_result_promise)
//   use dyn <- result.try(result)
//   let decoder = {
//     use categories <- decode.field(
//       "categories",
//       decode.list(category.decoder()),
//     )
//     use questions <- decode.field("questions", decode.list(question.decoder()))
//     decode.success(CachedData(categories, questions))
//   }
//   decode.run(dyn, decoder)
//   |> result.map_error(DecodeError)
// }

// /// 指定されたパスのコレクションからすべてのカテゴリドキュメントを取得します。
// pub fn get_categories() -> Promise(Result(List(category.Category), Err)) {
//   get_collection("categories", category.decoder())
// }

// /// 指定されたパスのコレクションからすべての質問ドキュメントを取得します。
// pub fn get_questions() -> Promise(Result(List(question.Model), Err)) {
//   get_collection("questions", question.decoder())
// }

// /// 指定されたIDでコレクションから単一のドキュメントを取得します。
// pub fn get_document_by_id(
//   path: String,
//   id: String,
//   decoder: Decoder(a),
// ) -> Promise(Result(a, Err)) {
//   let get_result_promise =
//     get_document_raw(path, id) |> promise_wrap_err(ExternalErr)
//   use result <- promise.map(get_result_promise)
//   use dyn <- result.try(result)
//   decode.run(dyn, decoder)
//   |> result.map_error(DecodeError)
// }

// /// 指定されたIDで単一の質問を取得します。
// pub fn get_question_by_id(id: String) -> Promise(Result(question.Model, Err)) {
//   get_document_by_id("questions", id, question.decoder())
// }

// /// 指定されたIDで単一のカテゴリを取得します。
// pub fn get_category_by_id(id: String) -> Promise(Result(category.Category, Err)) {
//   get_document_by_id("categories", id, category.decoder())
// }
// /// 指定されたIDでコレクション内のドキュメントを設定（上書き）します。
// /// 提供されたGleamの値は、送信前にJSONにエンコードされます。
// pub fn set_document(
//   path: String,
//   doc_id: String,
//   json: json.Json,
// ) -> Promise(Nil) {
//   encoder(data)
//   |> json.to_string
//   |> set_document_raw(path, doc_id, _)
// }
