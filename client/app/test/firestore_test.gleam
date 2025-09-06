// import gleam/javascript/promise
// import gleeunit
// import gleeunit/should
// import db/firestore

// pub fn main() {
//   gleeunit.main()
// }

// pub fn get_category_test() -> Nil {
//   let db = firestore.setup("db", 1)
//   promise.await(db, firestore.get_category)
//   |> promise.map(should.be_ok)
//   Nil
// }

// pub fn get_question_by_id_test() -> Nil {
//   let db = firestore.setup("db", 1)
//   promise.await(db, firestore.get_question_by_id(_, 1))
//   |> promise.map(should.be_ok)
//   Nil
// }
