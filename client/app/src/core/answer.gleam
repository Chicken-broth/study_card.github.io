import gleam/dict
import gleam/dynamic/decode
import gleam/list
import gleam/option.{type Option, None, Some}

type ID =
  Int

pub type Answer {
  Correct
  Incorrect
  NotAnswered
}

pub type History =
  dict.Dict(ID, Answer)

pub fn init(xs: List(ID)) -> History {
  list.map(xs, fn(x) { #(x, NotAnswered) })
  |> dict.from_list
}

pub fn decoder() {
  use s <- decode.then(decode.string)
  case from_string(s) {
    Some(ans) -> decode.success(ans)
    None -> decode.failure(NotAnswered, "decode err :NotAnswered")
  }
}

fn from_string(s: String) -> Option(Answer) {
  case s {
    "Correct" -> Some(Correct)
    "Incorrect" -> Some(Incorrect)
    "NotAnswered" -> Some(NotAnswered)
    _ -> None
  }
}

pub fn to_string(answer: Answer) -> String {
  case answer {
    Correct -> "Correct"
    Incorrect -> "Incorrect"
    NotAnswered -> "NotAnswered"
  }
}
