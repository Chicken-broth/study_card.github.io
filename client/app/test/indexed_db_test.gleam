import core/category
import gleam/int
import gleam/javascript/promise.{type Promise}
import gleam/list

// import gleam/result.{Error, Ok}
import gleeunit
import gleeunit/should
import interface/indexed_db.{type DB} as db

pub fn main() {
  gleeunit.main()
}

fn get_first_db(version: Int) -> Promise(DB) {
  let data_sets = db.get_data_set_name()
  let db_name = "db" <> int.to_string(version)
  let assert Ok(data_set) = list.first(data_sets)
  db.setup(data_sets, data_set, db_name, version)
}

fn get_second_db(version: Int) -> Promise(DB) {
  let data_sets = db.get_data_set_name()
  let db_name = "db" <> int.to_string(version)
  let assert Ok(data_set) = case data_sets {
    [_, second, ..] -> Ok(second)
    _ -> Error(Nil)
  }
  db.setup(data_sets, data_set, db_name, version)
}

/// `setup`が正常に完了することをテストします
pub fn setup_test() {
  use db <- promise.tap(get_first_db(1))
  should.be_ok(Ok(db))
  Nil
}

/// `get_category`がすべてのカテゴリを正しく取得できることをテストします
pub fn get_category_test() {
  use db <- promise.tap(get_first_db(2))
  use categories_promise <- promise.tap(db.get_categories(db))
  categories_promise
  |> should.be_ok
  Nil
}

/// `get_question_id_list`がすべての問題IDを正しく取得できることをテストします
pub fn get_question_id_list_test() {
  use db <- promise.tap(get_first_db(3))
  use id_list_promise <- promise.tap(db.get_question_id_list(db))
  id_list_promise
  |> should.be_ok
  Nil
}

/// `get_question_by_ids`が指定したIDのすべての問題を正しく取得できることをテストします
pub fn get_question_by_ids_test() {
  use db <- promise.tap(get_first_db(4))
  use question_id_list_result <- promise.await(db.get_question_id_list(db))
  let assert Ok(ids) = question_id_list_result

  use questions_reslult <- promise.tap(db.get_question_by_ids(db, ids))
  should.be_ok(questions_reslult)
  Nil
}

pub fn get_question_by_id_test() {
  use db <- promise.tap(get_first_db(5))
  use questions_reslult <- promise.tap(db.get_question_by_ids(db, [1]))
  should.be_ok(questions_reslult)
  Nil
}

pub fn save_and_get_quiz_history_test() {
  use db <- promise.tap(get_first_db(6))
  use quiz_history_result <- promise.tap(db.get_quiz_historys(db))
  should.be_ok(quiz_history_result)
  Nil
}

//decode_question_id_and_category_listpub 
pub fn get_question_id_and_category_list_test() {
  use db <- promise.tap(get_first_db(7))
  use quiz_history_result <- promise.tap(db.get_question_id_and_category_list(
    db,
  ))
  should.be_ok(quiz_history_result)
  Nil
}

pub fn db_switching_test() {
  let default_data_set_test = fn() {
    use default_db <- promise.await(get_first_db(8))
    use default_categories_dynamic <- promise.tap(db.get_categories(default_db))
    let assert Ok(default_categories) = default_categories_dynamic

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
    should.equal(default_categories, expected_default_categories)
  }
  let extra_data_set_test = fn() {
    // Test with "extra_db"
    use db <- promise.await(get_second_db(9))
    use result <- promise.tap(db.get_categories(db))
    let assert Ok(extra_categories) = result

    let expected_extra_categories = [
      category.Category(id: 1, name: "語根"),
      category.Category(id: 2, name: "接頭語"),
    ]
    should.equal(extra_categories, expected_extra_categories)
  }
  default_data_set_test()
  extra_data_set_test()
  Nil
}
