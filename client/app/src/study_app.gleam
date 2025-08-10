import category.{type Category}
import gleam/json
import gleam/list
import gleam/result
import lustre
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import plinth/javascript/storage
import question
import quiz_home
import quiz_screen
import result_screen
import sample_data

/// アプリケーション全体のモデル
pub type Model {
  Home(quiz_home.Model)
  Quiz(quiz_screen.Model)
  QuizResult(result_screen.Model)
  ErrScreen
}

/// アプリケーション全体のメッセージ
pub type Msg {
  HomeMsg(quiz_home.Msg)
  QuizMsg(quiz_screen.Msg)
  QuizResultMsg(result_screen.Msg)
  StartQuiz
}

fn ini_load_storage() -> Result(#(Model, Effect(Msg)), Nil) {
  use storage <- result.try(storage.local())
  use _ <- result.try(save_categories(storage, sample_data.sample_categories))
  use _ <- result.map(save_questions(storage, sample_data.sample_questions()))
  let #(home_model, home_effect) = quiz_home.init(storage)
  #(Home(home_model), effect.map(home_effect, HomeMsg))
}

/// アプリケーション全体の初期化
pub fn init(_) -> #(Model, Effect(Msg)) {
  ini_load_storage()
  |> result.unwrap(#(ErrScreen, none()))
}

/// ローカルストレージにカテゴリのリストを保存する。
/// この関数を動作させるには、`category`モジュールに`encoder`関数が必要です。
fn save_categories(
  storage: storage.Storage,
  categories: List(Category),
) -> Result(Nil, Nil) {
  let json_string = categories |> json.array(category.to_json) |> json.to_string
  storage.set_item(storage, "categories", json_string)
  |> result.map_error(fn(_) { Nil })
}

/// ローカルストレージに問題のリストを保存する。
/// この関数を動作させるには、`question`モジュールに`encoder`関数が必要です。
fn save_questions(
  storage: storage.Storage,
  questions: List(question.Model),
) -> Result(Nil, Nil) {
  let json_string = questions |> json.array(question.to_json) |> json.to_string
  storage.set_item(storage, "question", json_string)
  |> result.map_error(fn(_) { Nil })
  |> echo
}

fn wrap_result_err(a: Result(a, err)) -> Result(a, Nil) {
  result.map_error(a, fn(err) {
    echo err
    Nil
  })
}

/// アプリケーション全体の更新ロジック
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case model {
    Home(home_model) -> {
      case msg {
        HomeMsg(home_msg) -> {
          let #(new_home_model, home_effect) =
            quiz_home.update(home_model, home_msg)
          case home_msg {
            quiz_home.StartQuiz ->
              {
                let screen_ini = quiz_screen.init(new_home_model.questions)
                use quiz_model <- result.map(screen_ini)
                #(Quiz(quiz_model), effect.none())
              }
              |> result.unwrap(#(ErrScreen, effect.none()))
            _ -> #(Home(new_home_model), effect.map(home_effect, HomeMsg))
          }
        }
        _ -> #(model, none())
      }
    }
    Quiz(quiz_model) -> {
      case msg {
        QuizMsg(quiz_msg) -> {
          case quiz_msg {
            quiz_screen.GoToResultScreen -> {
              let #(result_model, result_effect) =
                result_screen.init(
                  quiz_screen.get_score(quiz_model.user_answers),
                  list.length(quiz_model.questions),
                  quiz_model.user_answers,
                  quiz_model.questions,
                )
              #(
                QuizResult(result_model),
                effect.map(result_effect, QuizResultMsg),
              )
            }
            _ -> {
              let new_quiz_model = quiz_screen.update(quiz_model, quiz_msg)
              #(Quiz(new_quiz_model), effect.none())
            }
          }
        }
        _ -> #(model, none())
      }
    }
    QuizResult(_) -> {
      case msg {
        QuizResultMsg(result_msg) -> {
          // let #(new_result_model, result_effect) =
          //   result_screen.update(result_model, result_msg)
          case result_msg {
            result_screen.GoToHome ->
              {
                let result_storage = storage.local() |> wrap_result_err
                use storage <- result.map(result_storage)
                let #(home_model, home_effect) = quiz_home.init(storage)
                #(Home(home_model), effect.map(home_effect, HomeMsg))
              }
              |> result.unwrap(#(ErrScreen, effect.none()))
          }
        }
        _ -> #(model, none())
      }
    }
    ErrScreen -> {
      case msg {
        _ -> #(model, none())
      }
    }
  }
}

/// アプリケーション全体のビュー
pub fn view(model: Model) -> Element(Msg) {
  case model {
    Home(home_model) ->
      quiz_home.view(home_model)
      |> element.map(HomeMsg)
    Quiz(quiz_model) ->
      quiz_screen.view(quiz_model)
      |> element.map(QuizMsg)
    QuizResult(result_model) ->
      result_screen.view(result_model)
      |> element.map(QuizResultMsg)
    ErrScreen -> html.text("エラーが発生しました")
  }
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}
