import core/category.{type Category}
import core/question.{type IdAndCategory}
import core/quiz_result.{type QuizResults}
import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/json

pub type DB

pub type Err =
  List(decode.DecodeError)

pub const default_data_set = "default_db"

pub const extra_data_set = "extra_db"

pub const data_set_list = [default_data_set, extra_data_set]

/// IndexedDBデータベースを初期化します。
/// `indexedDB_ffi.mjs`の`setup`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "setupDefaultDB")
fn setup_default_db(db_name: String, version: Int) -> Promise(DB)

@external(javascript, "./indexedDB_ffi.mjs", "setupExtraDB")
fn setup_extra_db(db_name: String, version: Int) -> Promise(DB)

/// setup_default_dbとsetup_extra_dbのラッパー
pub fn setup(db_name: String, version: Int, data_set: String) -> Promise(DB) {
  case data_set {
    d if extra_data_set == d -> {
      setup_extra_db(db_name, version)
    }
    _ -> setup_default_db(db_name, version)
  }
}

/// データベースからすべてのカテゴリを取得します。
/// `indexedDB_ffi.mjs`の`getCategories`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getCategories")
pub fn get_categories(db: DB) -> Promise(Dynamic)

pub fn get_categories_decode(dynamic: Dynamic) -> Result(List(Category), Err) {
  // echo dynamic
  decode.run(dynamic, decode.list(category.decoder()))
}

/// データベースから問題の総数を取得します。
/// `indexedDB_ffi.mjs`の`getQuestionCount`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionCount")
pub fn get_question_count(db: DB) -> Promise(Int)

/// データベースからすべての問題IDのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdList")
pub fn get_question_id_list(db: DB) -> Promise(Dynamic)

pub fn get_question_id_list_decode(dynamic: Dynamic) -> Result(List(Int), Err) {
  decode.run(dynamic, decode.list(decode.int))
}

/// IDを指定して特定の問題を取得します。
/// `indexedDB_ffi.mjs`の`getQuestionByIds`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionByIds")
pub fn get_question_by_ids(db: DB, id: List(Int)) -> Promise(Dynamic)

pub fn get_question_by_ids_decode(
  dynamic: Dynamic,
) -> Result(List(question.Model), Err) {
  decode.run(dynamic, decode.list(question.decoder()))
}

@external(javascript, "./indexedDB_ffi.mjs", "getQuestionById")
pub fn get_question_by_id(db: DB, id: Int) -> Promise(Dynamic)

pub fn get_question_by_id_decode(
  dynamic: Dynamic,
) -> Result(question.Model, Err) {
  decode.run(dynamic, question.decoder())
  // |> echo
}

/// データベースからすべての問題のIDとカテゴリのリストを取得します。
/// `indexedDB_ffi.mjs`の`getQuestionIdAndCategoryList`に対応します。
@external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdAndCategoryList")
pub fn get_question_id_and_category_list(db: DB) -> Promise(Dynamic)

/// 問題IDとカテゴリのペアを表す型
/// 取得した問題IDとカテゴリのリストをデコードします。
pub fn decode_question_id_and_category_list(
  dynamic: Dynamic,
) -> Result(List(IdAndCategory), Err) {
  let id_and_category_decoder = {
    use id <- decode.field("id", decode.int)
    use category <- decode.field(
      "category",
      question.qusetion_category_decoder(),
    )
    decode.success(question.IdAndCategory(id, category))
  }
  decode.run(dynamic, decode.list(id_and_category_decoder))
}

/// データベースにクイズ結果を保存します。
/// `indexedDB_ffi.mjs`の`saveQuizResult`に対応します。
/// 保存するresultオブジェクトはidを含まないdynamic型である必要があります。
@external(javascript, "./indexedDB_ffi.mjs", "saveQuizHistory")
pub fn save_quiz_history(db: DB, json: json.Json) -> Promise(Result(Nil, Nil))

/// データベースからすべてのクイズ結果を取得します。
/// `indexedDB_ffi.mjs`の`getQuizResults`に対応します。
/// decoder はhistory.decode_quiz_historys
@external(javascript, "./indexedDB_ffi.mjs", "getQuizHistory")
pub fn get_quiz_historys(db: DB) -> Promise(Dynamic)

/// 取得したクイズ結果のリストをデコードします。
pub fn decode_quiz_historys(dynamic: Dynamic) -> Result(QuizResults, Err) {
  decode.run(dynamic, quiz_result.decoder())
}
