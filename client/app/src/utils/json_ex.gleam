import gleam/dynamic/decode.{type Decoder}
import gleam/json

pub fn custom_type_to_json(typ: String, data: json.Json) {
  json.object([#("type", json.string(typ)), #("data", data)])
}

fn tab_decoder(tag_string: String) -> Decoder(String) {
  use typ <- decode.field("type", decode.string)
  case typ == tag_string {
    True -> {
      decode.success(typ)
    }
    False -> {
      decode.failure(typ, "type miss match")
    }
  }
}

pub fn custom_type_docoder(
  tab_string: String,
  decoder: Decoder(a),
) -> Decoder(a) {
  use _ <- decode.then(tab_decoder(tab_string))
  use a <- decode.field("data", decoder)
  decode.success(a)
}
// pub fn data_docoder_(
//   tab_string: String,
//   s1: String,
//   val1: Decoder(a),
//   to: fn(a) -> ct,
// ) -> Decoder(ct) {
//   use _ <- decode.then(tab_decoder(tab_string))
//   use val1 <- decode.field(s1, val1)
//   decode.success(to(val1))
// }

// pub fn custom_type2_docoder_(
//   to: fn(a, b) -> ct,
//   s1: String,
//   val1: Decoder(a),
//   s2: String,
//   val2: Decoder(b),
// ) -> Decoder(ct) {
//   use _ <- decode.then(tab_decoder(tab_string))
//   use val1 <- decode.field(s1, val1)
//   use val2 <- decode.field(s2, val2)
//   decode.success(to(val1, val2))
// }

// pub fn custom_type3_docoder_(
//   to: fn(a, b, c) -> ct,
//   s1: String,
//   val1: Decoder(a),
//   s2: String,
//   val2: Decoder(b),
//   s3: String,
//   val3: Decoder(c),
// ) -> Decoder(ct) {
//   use _ <- decode.then(tab_decoder(tab_string))
//   use val1 <- decode.field(s1, val1)
//   use val2 <- decode.field(s2, val2)
//   use val3 <- decode.field(s3, val3)
//   decode.success(to(val1, val2, val3))
// }
