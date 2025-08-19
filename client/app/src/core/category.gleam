import gleam/dynamic
import gleam/dynamic/decode.{type Decoder}
import gleam/json
import gleam/result

pub type Category {
  Category(id: Int, name: String)
}

pub fn eq(left: Category, right: Category) -> Bool {
  { left.id == right.id } && { left.name == right.name }
}

//db登録用のjsonを返す
pub fn set_json(name: String) -> json.Json {
  json.object([#("name", json.string(name))])
}

//カテゴリをjsonに変換する
pub fn to_json(category: Category) -> json.Json {
  let Category(id:, name:) = category
  json.object([#("id", json.int(id)), #("name", json.string(name))])
}

/// JsonからCategoryをデコードする
pub fn decoder() -> Decoder(Category) {
  use id <- decode.field("id", decode.int)
  use name <- decode.field("name", decode.string)
  decode.success(Category(id:, name:))
}

pub fn decode_question_list(
  dynamic: dynamic.Dynamic,
) -> Result(List(Category), json.DecodeError) {
  decode.run(dynamic, decode.list(decoder()))
  |> result.map_error(json.UnableToDecode)
}
