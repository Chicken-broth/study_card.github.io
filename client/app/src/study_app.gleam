import extra/effect_
import extra/promise_
import gleam/option.{None}
import interface/indexed_db.{type DB}
import lustre
import lustre/effect.{type Effect, none}
import lustre/element.{type Element}
import lustre/element/html
import pages/quiz_home
import pages/quiz_screen
import pages/result_screen

const db_version = "1"

/// アプリケーション全体のモデル
pub type Model {
  Loading
  Home(quiz_home.Model)
  QuizScreen(quiz_home.Model, quiz_screen.Model)
  QuizResult(quiz_home.Model, result_screen.Model)
  ErrScreen
}

/// アプリケーション全体のメッセージ
pub type Msg {
  HomeMsg(quiz_home.Msg)
  QuizMsg(quiz_screen.Msg)
  QuizResultMsg(result_screen.Msg)
  StartQuiz
  DataInitialized(DB)
  Miss
}

fn setup_db() -> Effect(Msg) {
  let data_sets = indexed_db.get_data_set_name()
  let db_name = "db" <> db_version
  echo "lustre setup_db"
  echo data_sets
  case data_sets {
    [first, _, ..] ->
      indexed_db.setup(data_sets, first, db_name, 1)
      |> promise_.to_effect_simple(DataInitialized)
    _ -> effect_.perform(Miss)
  }
}

/// アプリケーション全体の初期化
pub fn init(_) -> #(Model, Effect(Msg)) {
  #(Loading, setup_db())
}

/// アプリケーション全体の更新ロジック
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case model {
    Loading -> {
      case msg {
        DataInitialized(db) -> {
          // Pass categories and questions to quiz_home.init
          echo "DataInitialized"
          let #(home_model, home_effect) = quiz_home.init(db)
          #(Home(home_model), effect.map(home_effect, HomeMsg))
        }
        Miss -> {
          echo "setup err"
          #(ErrScreen, effect.none())
        }
        _ -> #(model, none())
        // Ignore other messages while loading
      }
    }
    Home(home_model) -> {
      case msg {
        HomeMsg(home_msg) -> {
          let #(new_home, home_effect) = quiz_home.update(home_model, home_msg)
          // echo home_msg
          case home_msg {
            quiz_home.OutCome(questions) -> {
              echo "Home -> QuizScreen"
              let screen_ini = quiz_screen.init(new_home.db, questions)
              case screen_ini {
                Ok(quiz_model) -> #(
                  QuizScreen(new_home, quiz_model),
                  effect.none(),
                )
                Error(_) -> #(ErrScreen, effect.none())
              }
            }
            _ -> #(Home(new_home), effect.map(home_effect, HomeMsg))
          }
        }
        _ -> #(model, none())
      }
    }
    QuizScreen(home_model, quiz_model) -> {
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
                  new_quiz_model.quiz_result,
                )
              #(
                QuizResult(home_model, result_model),
                effect.map(result_effect, QuizResultMsg),
              )
            }
            _ -> {
              #(
                QuizScreen(home_model, new_quiz_model),
                effect.map(quiz_eff, QuizMsg),
              )
            }
          }
        }
        _ -> #(model, none())
      }
    }
    QuizResult(home_model, result_model) -> {
      case msg {
        QuizResultMsg(result_msg) -> {
          let #(new_model, eff) = result_screen.update(result_model, result_msg)

          case result_msg {
            result_screen.OutCome -> {
              // 保持していたhome_modelを再利用し、最新の学習履歴を取得するEffectを発行する
              let get_results_effect =
                result_model.db
                |> indexed_db.get_quiz_results
                |> promise_.to_effect(
                  quiz_home.GetQuizHistory,
                  quiz_home.ErrScreen,
                )
              #(Home(home_model), effect.map(get_results_effect, HomeMsg))
            }
            _ -> #(
              QuizResult(home_model, new_model),
              effect.map(eff, QuizResultMsg),
            )
          }
        }
        _ -> #(model, none())
      }
    }
    ErrScreen ->
      case msg {
        _ -> #(model, none())
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
    QuizScreen(_, quiz_model) ->
      quiz_screen.view(quiz_model)
      |> element.map(QuizMsg)
    QuizResult(_, result_model) ->
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
