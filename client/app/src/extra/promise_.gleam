import gleam/javascript/promise.{type Promise}
import lustre/effect.{type Effect}

///
/// PromiseをLustreのEffectに変換するヘルパー関数。
///
/// Promiseが解決されたときに、その結果をデコードし、成功または失敗のメッセージをディスパッチします。
///
/// Args:
///   - promise: 解決を待つPromise。
///   - decoder: Promiseの解決結果をデコードするための関数。
///   - to_success_msg: デコードが成功した場合に生成されるメッセージを返す関数。
///   - to_err_msg: デコードが失敗した場合に生成されるエラーメッセージを返す関数。
pub fn to_effect(
  promise: Promise(Result(a, err)),
  // decoder: fn(a) -> Result(a, err),
  to_success_msg: fn(a) -> msg,
  to_err_msg: fn(err) -> msg,
) -> Effect(msg) {
  use dispatch <- effect.from
  promise
  |> promise.map(fn(result) {
    // echo dynamic
    // let result = decoder(dynamic)
    case result {
      Ok(a) -> to_success_msg(a)
      Error(err) -> to_err_msg(err)
    }
  })
  |> promise.tap(dispatch)
  Nil
}

pub fn to_effect_simple(
  promise: Promise(a),
  to_msg: fn(a) -> msg,
) -> Effect(msg) {
  use dispatch <- effect.from
  promise.map(promise, to_msg)
  |> promise.tap(dispatch)
  // |> echo
  Nil
}
