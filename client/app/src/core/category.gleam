import gleam/dynamic/decode.{type Decoder}
import gleam/json

pub type Category {
  Category(id: String, name: String)
}

//カテゴリをjsonに変換する
pub fn to_json(category: Category) -> json.Json {
  let Category(id:, name:) = category
  json.object([#("id", json.string(id)), #("name", json.string(name))])
}

/// JsonからCategoryをデコードする
pub fn decoder() -> Decoder(Category) {
  use id <- decode.field("id", decode.string)
  use name <- decode.field("name", decode.string)
  decode.success(Category(id:, name:))
}
