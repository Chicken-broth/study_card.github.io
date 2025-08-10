import category.{Category}
import gleam/json
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

pub fn decoder_test() {
  // 正常にデコードできるケース
  "{\"id\":\"gleam_basic\",\"name\":\"Gleam基礎\"}"
  |> json.parse(category.decoder())
  |> should.equal(Ok(Category("gleam_basic", "Gleam基礎")))

  // フィールドが不足しているため失敗するケース
  "{\"id\":\"gleam_basic\"}"
  |> json.parse(category.decoder())
  |> should.be_error

  // フィールドの型が違うため失敗するケース
  "{\"id\":\"gleam_basic\",\"name\":123}"
  |> json.parse(category.decoder())
  |> should.be_error
}

pub fn to_json_test() {
  let cat = Category(id: "cat1", name: "My Category")
  let expected =
    json.object([
      #("id", json.string("cat1")),
      #("name", json.string("My Category")),
    ])

  category.to_json(cat)
  |> should.equal(expected)
}
