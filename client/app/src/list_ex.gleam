//配列のユーティリティ関数
import gleam/list
import gleam/option.{type Option, None, Some}

pub fn get_at(list: List(a), at: Int) -> Option(a) {
  list.drop(list, at)
  |> fn(xs) {
    case xs {
      [x, ..] -> Some(x)
      [] -> None
    }
  }
}

pub fn insert_at(list: List(a), at: Int, val: a) -> List(a) {
  //listのindexに合致する要素をfunで処理
  let ind = at + 1
  let #(befor, after) = list.split(list, ind)
  list.append(befor, [val, ..after])
}

pub fn remove_at(list: List(a), at: Int) -> List(a) {
  let ind = at - 1
  let #(befor, after) = list.split(list, ind)
  case after {
    [_, ..rest] -> list.append(befor, rest)
    [] -> befor
  }
}

pub fn update_at(list: List(a), at: Int, fun: fn(a) -> a) -> List(a) {
  //listのindexに合致する要素をfunで処理
  list.index_map(list, fn(x, index) {
    case index == at {
      True -> {
        fun(x)
      }
      False -> {
        x
      }
    }
  })
}

pub fn update_if(
  list: List(a),
  prefix: fn(a) -> Bool,
  fun: fn(a) -> a,
) -> List(a) {
  list.map(list, fn(x) {
    case prefix(x) {
      True -> {
        fun(x)
      }
      False -> {
        x
      }
    }
  })
}

pub fn set_at(list: List(a), at: Int, val: a) -> List(a) {
  //listのindexに合致する要素をfunで処理
  list.index_map(list, fn(x, index) {
    case index == at {
      True -> {
        x
      }
      False -> {
        val
      }
    }
  })
}

pub fn combine(list: List(Result(a, err))) -> Result(List(a), err) {
  combine_help(list, [])
}

fn combine_help(
  list: List(Result(a, err)),
  acc: List(a),
) -> Result(List(a), err) {
  case list {
    [head, ..tail] ->
      case head {
        Ok(a) -> combine_help(tail, [a, ..acc])

        Error(a) -> Error(a)
      }

    [] -> Ok(list.reverse(acc))
  }
}
