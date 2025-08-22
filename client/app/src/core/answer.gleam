import gleam/dynamic/decode
import gleam/json
import gleam/option.{type Option, None, Some}
import lustre/element
import lustre/element/html

pub type Answer {
  Correct
  Incorrect
  NotAnswered
}

pub fn is_correct(answer: Answer) -> Bool {
  case answer {
    Correct -> True
    _ -> False
  }
}

// pub type History =
//   dict.Dict(ID, Answer)

// pub fn init(xs: List(ID)) -> History {
//   list.map(xs, fn(x) { #(x, NotAnswered) })
//   |> dict.from_list
// }

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

pub fn to_json(answer: Answer) -> json.Json {
  json.string(to_string(answer))
}

pub fn to_string(answer: Answer) -> String {
  case answer {
    Correct -> "Correct"
    Incorrect -> "Incorrect"
    NotAnswered -> "NotAnswered"
  }
}

pub fn view(answer: Answer) -> element.Element(msg) {
  case answer {
    Correct -> "○"
    Incorrect -> "✖"
    NotAnswered -> "-"
  }
  |> html.text
}
