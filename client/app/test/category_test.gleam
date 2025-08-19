import core/category.{Category}
import gleam/dynamic
import gleam/dynamic/decode
import gleam/json
import gleeunit
import gleeunit/should

@external(javascript, "./mockData.mjs", "validCategory")
fn get_valid_category_dynamic() -> dynamic.Dynamic

@external(javascript, "./mockData.mjs", "invalidCategoryMissingName")
fn get_invalid_category_missing_name_dynamic() -> dynamic.Dynamic

@external(javascript, "./mockData.mjs", "invalidCategoryIdAsString")
fn get_invalid_category_id_as_string_dynamic() -> dynamic.Dynamic

pub fn main() {
  gleeunit.main()
}

/// 正常なデータをデコードできることをテストします
pub fn decoder_success_test() {
  // echo "decoder_success_test"
  get_valid_category_dynamic()
  |> decode.run(category.decoder())
  |> should.equal(Ok(Category(id: 1, name: "Gleam基礎")))
}

/// フィールドが不足している場合にデコードが失敗することをテストします
pub fn decoder_fail_missing_field_test() {
  // echo "decoder_fail_missing_field_test"
  get_invalid_category_missing_name_dynamic()
  |> decode.run(category.decoder())
  |> should.be_error
}

/// フィールドの型が違う場合にデコードが失敗することをテストします
pub fn decoder_fail_wrong_type_test() {
  // echo "decoder_fail_wrong_type_test"
  get_invalid_category_id_as_string_dynamic()
  |> decode.run(category.decoder())
  |> should.be_error
}

pub fn to_json_test() {
  // echo "to_json_test"
  let cat = Category(id: 1, name: "My Category")
  let expected =
    json.object([#("id", json.int(1)), #("name", json.string("My Category"))])

  category.to_json(cat)
  |> should.equal(expected)
}

/// デコードしたデータを再度エンコードし、元のJSON構造と一致するかをテストします。
pub fn decode_then_encode_test() {
  // echo "decode_then_encode_test"
  // 1. mockDataからvalidなデータを取得し、デコードします
  let assert Ok(decoded_category) =
    get_valid_category_dynamic()
    |> decode.run(category.decoder())

  // 2. デコードしたデータを再度JSONにエンコードします
  let encoded_json = category.to_json(decoded_category)

  // 3. エンコード後のJSONが期待通りか検証します
  let expected_json =
    json.object([#("id", json.int(1)), #("name", json.string("Gleam基礎"))])
  encoded_json
  |> should.equal(expected_json)
}

pub fn to_json_fail_test() {
  // echo "to_json_fail_test"
  let cat = Category(id: 1, name: "My Category")

  // idの型がStringになっている不正なJSON
  let incorrect_json =
    json.object([
      #("id", json.string("1")),
      #("name", json.string("My Category")),
    ])

  // to_jsonの結果が不正なJSONと一致しないことを確認
  category.to_json(cat)
  |> should.not_equal(incorrect_json)
}
