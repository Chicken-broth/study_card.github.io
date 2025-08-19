import core/answer
import interface/indexed_db.{type DB, setup}
import lustre
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import pages/quiz_home
import pages/quiz_screen
import pages/result_screen
import utils/promise_ex

const db_name = "db"

const db_version = 1

/// アプリケーション全体のモデル
pub type Model {
  Loading
  Home(quiz_home.Model)
  QuizScreen(quiz_screen.Model)
  QuizResult(result_screen.Model)
  ErrScreen
}

/// アプリケーション全体のメッセージ
pub type Msg {
  HomeMsg(quiz_home.Msg)
  QuizMsg(quiz_screen.Msg)
  QuizResultMsg(result_screen.Msg)
  StartQuiz
  DataInitialized(DB)
}

/// アプリケーション全体の初期化
pub fn init(_) -> #(Model, Effect(Msg)) {
  #(
    Loading,
    promise_ex.to_effect_no_decode(setup(db_name, db_version), DataInitialized),
  )
}

/// アプリケーション全体の更新ロジック
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case model {
    Loading -> {
      case msg {
        DataInitialized(db) -> {
          // Pass categories and questions to quiz_home.init
          let history = answer.init([])
          let #(home_model, home_effect) = quiz_home.init(db, history)
          #(Home(home_model), effect.map(home_effect, HomeMsg))
        }

        _ -> #(model, none())
        // Ignore other messages while loading
      }
    }
    Home(home_model) -> {
      case msg {
        HomeMsg(home_msg) -> {
          let #(new_home_model, home_effect) =
            quiz_home.update(home_model, home_msg)
          // echo home_msg
          case home_msg {
            quiz_home.OutCome(questions) -> {
              echo "Home -> QuizScreen"
              let screen_ini =
                quiz_screen.init(
                  new_home_model.db,
                  questions,
                  new_home_model.history,
                )
              case screen_ini {
                Ok(quiz_model) -> #(QuizScreen(quiz_model), effect.none())
                Error(_) -> #(ErrScreen, effect.none())
              }
            }
            _ -> #(Home(new_home_model), effect.map(home_effect, HomeMsg))
          }
        }
        _ -> #(model, none())
      }
    }
    QuizScreen(quiz_model) -> {
      case msg {
        QuizMsg(quiz_msg) -> {
          let #(new_quiz_model, quiz_eff) =
            quiz_screen.update(quiz_model, quiz_msg)
          case quiz_msg {
            quiz_screen.OutCome -> {
              let #(result_model, result_effect) =
                result_screen.init(
                  new_quiz_model.db,
                  new_quiz_model.score,
                  new_quiz_model.questions_count,
                  new_quiz_model.answers,
                  new_quiz_model.history,
                )
              #(
                QuizResult(result_model),
                effect.map(result_effect, QuizResultMsg),
              )
            }
            _ -> {
              #(QuizScreen(new_quiz_model), effect.map(quiz_eff, QuizMsg))
            }
          }
        }
        _ -> #(model, none())
      }
    }
    QuizResult(quiz_model) -> {
      case msg {
        QuizResultMsg(result_msg) -> {
          case result_msg {
            result_screen.GoToHome -> {
              let #(new_modek, new_eff) =
                quiz_home.init(quiz_model.db, quiz_model.history)
              #(Home(new_modek), effect.map(new_eff, HomeMsg))
            }
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
    Loading -> html.text("Loading...")
    Home(home_model) ->
      quiz_home.view(home_model)
      |> element.map(HomeMsg)
    QuizScreen(quiz_model) ->
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
