import lustre/effect.{type Effect}

pub fn perform(msg: msg) -> Effect(msg) {
  effect.from(fn(dispatch) {
    dispatch(msg)
    Nil
  })
}
