import gleam/dynamic.{type Dynamic}
import gleam/javascript/promise.{type Promise}
import lustre/effect.{type Effect}

pub fn to_effect(
  promise: Promise(Dynamic),
  decoder: fn(Dynamic) -> Result(a, err),
  to_success_msg: fn(a) -> msg,
  to_err_msg: fn(err) -> msg,
) -> Effect(msg) {
  use dispatch <- effect.from
  promise
  |> promise.map(fn(dynamic) {
    echo dynamic
    let result = decoder(dynamic)
    case result {
      Ok(a) -> to_success_msg(a)
      Error(err) -> to_err_msg(err)
    }
  })
  |> promise.tap(dispatch)
  Nil
}

pub fn to_effect_no_decode(
  promise: Promise(a),
  to_msg: fn(a) -> msg,
) -> Effect(msg) {
  use dispatch <- effect.from
  promise.map(promise, to_msg)
  |> promise.tap(dispatch)
  Nil
}
