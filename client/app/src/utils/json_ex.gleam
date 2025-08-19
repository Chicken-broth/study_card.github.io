import gleam/dynamic/decode.{type Decoder}
import gleam/json
import gleam/list
import gleam/string

pub fn custom_type_to_json(typ: String, data: json.Json) {
  json.object([#("type", json.string(typ)), #("data", data)])
}

pub fn custom_type_docoder(
  tab_string: String,
  decoder: Decoder(a),
) -> Decoder(a) {
  use typ <- decode.field("type", decode.string)
  use a <- decode.field("data", decoder)
  case typ == tab_string {
    True -> decode.success(a)
    False -> decode.failure(a, "type miss match:::")
  }
}

pub fn errs_to_string(errs: List(decode.DecodeError)) -> String {
  list.map(errs, fn(err) {
    [
      "DecodeError:",
      "  expect:" <> err.expected,
      "  found:" <> err.found,
      "  path:" <> string.join(err.path, ","),
    ]
    |> string.join("/n")
  })
  |> string.join("\n")
}

pub fn json_err_to_string(err: json.DecodeError) -> String {
  case err {
    json.UnexpectedEndOfInput -> "Unexpected end of input"
    json.UnexpectedByte(byte) -> "Unexpected byte: " <> byte
    json.UnexpectedSequence(seq) -> "Unexpected sequence: " <> seq
    json.UnableToDecode(errors) -> errs_to_string(errors)
  }
}
