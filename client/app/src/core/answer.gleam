import gleam/dict
import gleam/list

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
