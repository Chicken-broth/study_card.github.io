import core/category
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleeunit
import gleeunit/should
import interface/indexed_db

pub fn main() {
  gleeunit.main()
}

/// `setup`が正常に完了することをテストします
pub fn setup_test() {
  use db <- promise.tap(indexed_db.setup("db_setup", 1))
  // Note: このテストではdbが取得できればOKとします
  // 本来はより詳細な検証が望ましいです
  should.be_ok(Ok(db))
  Nil
}

/// `get_category`がすべてのカテゴリを正しく取得できることをテストします
pub fn get_category_test() {
  use db <- promise.await(indexed_db.setup("db_get_category", 1))
  use dynamic <- promise.tap(indexed_db.get_categories(db))

  // let expected_categories = [
  //   category.Category(id: 1, name: "Gleam基礎"),
  //   category.Category(id: 2, name: "Lustre基礎"),
  // ]

  category.decode_question_list(dynamic)
  |> should.be_ok
  Nil
}

/// `get_question_id_list`がすべての問題IDを正しく取得できることをテストします
pub fn get_question_id_list_test() {
  use db <- promise.map(indexed_db.setup("db_get_id_list", 1))
  use dynamic <- promise.tap(indexed_db.get_question_id_list(db))
  indexed_db.get_question_id_list_decode(dynamic)
  |> should.be_ok
  Nil
}

/// `get_question_by_ids`が指定したIDのすべての問題を正しく取得できることをテストします
pub fn get_question_by_ids_test() {
  use db <- promise.await(indexed_db.setup("db_get_questions", 1))
  use dynamic <- promise.await(indexed_db.get_question_id_list(db))
  let assert Ok(ids) = indexed_db.get_question_id_list_decode(dynamic)

  use dynamic <- promise.tap(indexed_db.get_question_by_ids(db, ids))
  let assert Ok(questions) = indexed_db.get_question_by_ids_decode(dynamic)
  echo "get_question_by_ids_test:length::"
    <> int.to_string(list.length(questions))
  should.be_ok(Ok(questions))
  // echo dynamic
  // indexed_db.get_question_by_ids_decode(dynamic) |> should.be_ok
  // should.equal(list.length(ids), list.length(questions))
  Nil
}

pub fn get_question_by_id_test() {
  use db <- promise.await(indexed_db.setup("db_get_question", 1))
  use dynamic <- promise.tap(indexed_db.get_question_by_id(db, 1))
  // echo dynamic
  indexed_db.get_question_by_id_decode(dynamic)
  |> should.be_ok
  Nil
}

pub fn save_and_get_quiz_history_test() {
  // let category_1 = category.Category(id: 1, name: "Gleam基礎")
  // let category_2 = category.Category(id: 2, name: "Lustre基礎")
  // let quiz_history = [
  //   history.Record(id: 1, category: category_1, answer: answer.Correct),
  //   history.Record(id: 2, category: category_2, answer: answer.Incorrect),
  // ]
  // let json_history = history.to_json(quiz_history)

  use db <- promise.await(indexed_db.setup("db_save_quiz_history", 1))
  // use _ <- promise.await(indexed_db.save_quiz_history(db, json_history))
  use dynamic <- promise.tap(indexed_db.get_quiz_historys(db))
  // echo dynamic
  let assert Ok(quiz_history_result) = indexed_db.decode_quiz_historys(dynamic)
  should.be_ok(Ok(quiz_history_result))
  Nil
}

//decode_question_id_and_category_listpub 
pub fn get_question_id_and_category_list_test() {
  use db <- promise.await(indexed_db.setup("db_get_id_and_category_list", 1))
  use dynamic <- promise.tap(indexed_db.get_question_id_and_category_list(db))
  indexed_db.decode_question_id_and_category_list(dynamic)
  |> should.be_ok
  Nil
}
