import gleam/dynamic/decode.{type Decoder}
import gleam/json

pub fn custom_type_to_json(symbol: String) {
  json.string(symbol)
}

pub fn custom_type_to_json_(symbol: String, fields: List(#(String, json.Json))) {
  json.object([#(symbol, json.object(fields))])
}

pub fn custom_type0_docoder(ct: custom_type) -> Decoder(custom_type) {
  decode.success(ct)
}

pub fn custom_type1_docoder_(to: fn(a) -> ct, s1: String, val1: Decoder(a)) {
  use a <- decode.field(s1, val1)
  decode.success(to(a))
}

pub fn custom_type2_docoder_(
  to: fn(a, b) -> ct,
  s1: String,
  val1: Decoder(a),
  s2: String,
  val2: Decoder(b),
) {
  use val1 <- decode.field(s1, val1)
  use val2 <- decode.field(s2, val2)
  decode.success(to(val1, val2))
}

pub fn custom_type3_docoder_(
  to: fn(a, b, c) -> ct,
  s1: String,
  val1: Decoder(a),
  s2: String,
  val2: Decoder(b),
  s3: String,
  val3: Decoder(c),
) -> Decoder(ct) {
  use val1 <- decode.field(s1, val1)
  use val2 <- decode.field(s2, val2)
  use val3 <- decode.field(s3, val3)
  decode.success(to(val1, val2, val3))
}
