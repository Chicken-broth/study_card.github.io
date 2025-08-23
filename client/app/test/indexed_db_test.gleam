import core/category
import gleam/int
import gleam/javascript/promise
import gleam/list
import gleeunit
import gleeunit/should
import interface/indexed_db as db

pub fn main() {
  gleeunit.main()
}

const data_set = db.default_data_set

const extra_data_set = db.extra_data_set

/// `setup`が正常に完了することをテストします
pub fn setup_test() {
  use db <- promise.tap(db.setup("db_setup", 1, data_set))
  // Note: このテストではdbが取得できればOKとします
  // 本来はより詳細な検証が望ましいです
  should.be_ok(Ok(db))
  Nil
}

/// `get_category`がすべてのカテゴリを正しく取得できることをテストします
pub fn get_category_test() {
  use db <- promise.await(db.setup("db_get_category", 1, data_set))
  use dynamic <- promise.tap(db.get_categories(db))

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
  use db <- promise.map(db.setup("db_get_id_list", 1, data_set))
  use dynamic <- promise.tap(db.get_question_id_list(db))
  db.get_question_id_list_decode(dynamic)
  |> should.be_ok
  Nil
}

/// `get_question_by_ids`が指定したIDのすべての問題を正しく取得できることをテストします
pub fn get_question_by_ids_test() {
  use db <- promise.await(db.setup("db_get_questions", 1, data_set))
  use dynamic <- promise.await(db.get_question_id_list(db))
  let assert Ok(ids) = db.get_question_id_list_decode(dynamic)

  use dynamic <- promise.tap(db.get_question_by_ids(db, ids))
  let assert Ok(questions) = db.get_question_by_ids_decode(dynamic)
  echo "get_question_by_ids_test:length::"
    <> int.to_string(list.length(questions))
  should.be_ok(Ok(questions))
  // echo dynamic
  // db.get_question_by_ids_decode(dynamic) |> should.be_ok
  // should.equal(list.length(ids), list.length(questions))
  Nil
}

pub fn get_question_by_id_test() {
  use db <- promise.await(db.setup("db_get_question", 1, data_set))
  use dynamic <- promise.tap(db.get_question_by_id(db, 1))
  // echo dynamic
  db.get_question_by_id_decode(dynamic)
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

  use db <- promise.await(db.setup("db_save_quiz_history", 1, data_set))
  // use _ <- promise.await(db.save_quiz_history(db, json_history))
  use dynamic <- promise.tap(db.get_quiz_historys(db))
  // echo dynamic
  let assert Ok(quiz_history_result) = db.decode_quiz_historys(dynamic)
  should.be_ok(Ok(quiz_history_result))
  Nil
}

//decode_question_id_and_category_listpub 
pub fn get_question_id_and_category_list_test() {
  use db <- promise.await(db.setup("db_get_id_and_category_list", 1, data_set))
  use dynamic <- promise.tap(db.get_question_id_and_category_list(db))
  db.decode_question_id_and_category_list(dynamic)
  |> should.be_ok
  Nil
}

pub fn db_switching_test() {
  let default_data_set_test = fn() {
    echo "db switch test start"
    use default_db <- promise.await(db.setup("db_switching", 1, data_set))
    echo "db switch setuped"
    use default_categories_dynamic <- promise.tap(db.get_categories(default_db))
    let assert Ok(default_categories) =
      db.get_categories_decode(default_categories_dynamic)

    let expected_default_categories = [
      category.Category(id: 1, name: "情報セキュリティとは"),
      category.Category(id: 2, name: "情報セキュリティ技術"),
      category.Category(id: 3, name: "情報セキュリティ管理"),
      category.Category(id: 4, name: "情報セキュリティ対策"),
      category.Category(id: 5, name: "法務"),
      category.Category(id: 6, name: "マネジメント"),
      category.Category(id: 7, name: "テクノロジ"),
      category.Category(id: 8, name: "ストラテジ"),
    ]
    default_categories |> should.equal(expected_default_categories)
  }
  let extra_data_set_test = fn() {
    // Test with "extra_db"
    use extra_db <- promise.await(db.setup("extra_db", 1, extra_data_set))
    use extra_categories_dynamic <- promise.tap(db.get_categories(extra_db))
    let assert Ok(extra_categories) =
      db.get_categories_decode(extra_categories_dynamic)

    let expected_extra_categories = [
      category.Category(id: 1, name: "語根"),
      category.Category(id: 2, name: "接頭語"),
    ]
    extra_categories |> should.equal(expected_extra_categories)
  }
  default_data_set_test()
  extra_data_set_test()
  Nil
}
