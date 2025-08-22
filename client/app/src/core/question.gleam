import core/answer.{type Answer, NotAnswered}
import core/association_question as as_question
import core/multiple_choice_question as mc_question
import extra/json_
import gleam/dynamic as dynamic
import gleam/dynamic/decode.{type Decoder}
import gleam/json
import lustre/element.{type Element}

/// クイズの問題全体を表す型
/// id、カテゴリ、問題文、そして問題のインタラクション部分（選択肢や組み合わせなど）を保持する
pub type Model {
  Model(
    id: Int,
    category: QusetionCategory,
    question_text: String,
    question_interaction: QuestionInteraction,
  )
}

pub type QusetionCategory {
  QusetionCategory(id: Int, name: String, sub_id: Int, sub_name: String)
}

pub type IdAndCategory {
  IdAndCategory(id: Int, category: QusetionCategory)
}

/// 問題のインタラクション部分を表す型
/// - `MultipleChoice`: 四択問題
/// - `Association`: 組み合わせ問題
pub type QuestionInteraction {
  MultipleChoice(mc_question.Model)
  Association(as_question.Model)
}

pub type Msg {
  MultipleChoiceMsg(mc_question.Msg)
  AssociationMsg(as_question.Msg)
}

pub fn init(
  id: Int,
  category: QusetionCategory,
  question_text: String,
  question_interaction: QuestionInteraction,
) -> Model {
  Model(
    id: id,
    category: category,
    question_text: question_text,
    question_interaction: question_interaction,
  )
}

/// 回答の正誤を判定する
/// `quiz_screen`の`check_answer`ロジックをここに集約する。
/// 組み合わせ問題は、完了していれば正解、そうでなければ（Nextが押された時点で）不正解とみなす。
pub fn check_answer(model: Model) -> Answer {
  case model.question_interaction {
    MultipleChoice(mc_model) -> mc_model.answer
    Association(as_model) -> as_model.answer
  }
}

pub fn is_answered(model: Model) -> Bool {
  case check_answer(model) {
    NotAnswered -> False
    _ -> True
  }
}

pub fn update(model: Model, msg: Msg) -> Model {
  case msg {
    MultipleChoiceMsg(mc_msg) -> {
      case model.question_interaction {
        MultipleChoice(mc_model) -> {
          let new_mc_model = mc_question.update(mc_model, mc_msg)
          Model(..model, question_interaction: MultipleChoice(new_mc_model))
        }
        _ -> model
      }
    }
    AssociationMsg(as_msg) -> {
      case model.question_interaction {
        Association(as_model) -> {
          let new_as_model = as_question.update(as_model, as_msg)
          Model(..model, question_interaction: Association(new_as_model))
        }
        _ -> model
      }
    }
  }
}

pub fn view(model: Model) -> Element(Msg) {
  case model.question_interaction {
    MultipleChoice(mc_model) ->
      element.map(mc_question.view(mc_model), fn(m) { MultipleChoiceMsg(m) })
    Association(as_model) ->
      element.map(as_question.view(as_model), fn(m) { AssociationMsg(m) })
  }
}

/// `QuestionInteraction` 型を JSON に変換する
fn interaction_to_json(interaction: QuestionInteraction) -> json.Json {
  case interaction {
    MultipleChoice(question_model) ->
      json_.custom_type_to_json(
        "MultipleChoice",
        mc_question.to_json(question_model),
      )
    Association(question_model) ->
      json_.custom_type_to_json(
        "Association",
        as_question.to_json(question_model),
      )
  }
}

/// JSON から `QuestionInteraction` 型にデコードする
fn interaction_decoder() -> Decoder(QuestionInteraction) {
  let decode_mc = fn() {
    let decoder = decode.map(mc_question.decoder(), MultipleChoice)
    json_.custom_type_docoder("MultipleChoice", decoder)
  }

  let decode_as = fn() {
    let decoder = decode.map(as_question.decoder(), Association)
    json_.custom_type_docoder("Association", decoder)
  }
  decode.one_of(decode_as(), [decode_mc()])
}

/// `Model` 型を JSON に変換する
pub fn to_json(model: Model) -> json.Json {
  json.object([
    #("id", json.int(model.id)),
    #("category", qusetion_category_to_json(model.category)),
    #("question_text", json.string(model.question_text)),
    #("question_interaction", interaction_to_json(model.question_interaction)),
  ])
}

pub fn qusetion_category_to_json(category: QusetionCategory) -> json.Json {
  json.object([
    #("id", json.int(category.id)),
    #("name", json.string(category.name)),
    #("sub_id", json.int(category.sub_id)),
    #("sub_name", json.string(category.sub_name)),
  ])
}

/// JSON から `Model` 型にデコードする
pub fn decoder() -> Decoder(Model) {
  use id <- decode.field("id", decode.int)
  use category <- decode.field("category", qusetion_category_decoder())
  use question_text <- decode.field("question_text", decode.string)
  use question_interaction <- decode.field(
    "question_interaction",
    interaction_decoder(),
  )
  decode.success(Model(id:, category:, question_text:, question_interaction:))
}

pub fn qusetion_category_decoder() -> Decoder(QusetionCategory) {
  use id <- decode.field("id", decode.int)
  use name <- decode.field("name", decode.string)
  use sub_id <- decode.field("sub_id", decode.int)
  use sub_name <- decode.field("sub_name", decode.string)
  decode.success(QusetionCategory(id, name, sub_id, sub_name))
}

// pub fn decode_question_list(
//   dynamic: dynamic.Dynamic,
// ) -> Result(List(Model), json.DecodeError) {
//   decode.run(dynamic, decode.list(decoder()))
//   |> result.map_error(json.UnableToDecode)
// }