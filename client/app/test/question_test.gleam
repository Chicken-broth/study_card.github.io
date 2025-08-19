import core/association_question
import core/category
import core/multiple_choice_question
import core/question
import gleam/dynamic
import gleam/dynamic/decode
import gleam/json
import gleeunit
import gleeunit/should

@external(javascript, "./mockData.mjs", "validMultipleChoiceQuestion")
fn get_valid_mc_question_dynamic() -> dynamic.Dynamic

@external(javascript, "./mockData.mjs", "validAssociationQuestion")
fn get_valid_as_question_dynamic() -> dynamic.Dynamic

@external(javascript, "./mockData.mjs", "invalidQuestionWrongInteractionType")
fn get_invalid_question_wrong_interaction_type_dynamic() -> dynamic.Dynamic

@external(javascript, "./mockData.mjs", "invalidQuestionWrongAnswerIndexType")
fn get_invalid_question_wrong_answer_index_type_dynamic() -> dynamic.Dynamic

pub fn main() {
  gleeunit.main()
}

/// 正常な四択問題データをデコードできることをテストします
pub fn decoder_success_multiple_choice_test() {
  let decoded =
    get_valid_mc_question_dynamic()
    |> decode.run(question.decoder())
  should.be_ok(Ok(decoded))
}

/// 正常な組み合わせ問題データをデコードできることをテストします
pub fn decoder_success_association_test() {
  let decoded =
    get_valid_as_question_dynamic()
    |> decode.run(question.decoder())
  should.be_ok(Ok(decoded))
}

/// `question_interaction` の `type` が不正な場合にデコードが失敗することをテストします
pub fn decoder_fail_wrong_interaction_type_test() {
  get_invalid_question_wrong_interaction_type_dynamic()
  |> decode.run(question.decoder())
  |> should.be_error
}

/// `question_interaction` の `data` の型が不正な場合にデコードが失敗することをテストします
pub fn decoder_fail_wrong_data_type_test() {
  get_invalid_question_wrong_answer_index_type_dynamic()
  |> decode.run(question.decoder())
  |> should.be_error
}

/// デコードした四択問題を再度エンコードし、元のJSON構造と一致するかをテストします
pub fn decode_then_encode_multiple_choice_test() {
  let assert Ok(decoded_question) =
    get_valid_mc_question_dynamic()
    |> decode.run(question.decoder())
  let encoded_json = question.to_json(decoded_question)

  // mockData.mjs の validMultipleChoiceQuestion と同じ構造を持つJSONを構築
  let expected_json =
    json.object([
      #("id", json.int(1)),
      #(
        "category",
        json.object([#("id", json.int(1)), #("name", json.string("Gleam基礎"))]),
      ),
      #("question_text", json.string("Gleamの型で、不変なデータ構造を表現するものはどれ？")),
      #(
        "question_interaction",
        json.object([
          #("type", json.string("MultipleChoice")),
          #(
            "data",
            json.object([
              #(
                "texts",
                json.array(
                  [
                    json.string("List"),
                    json.string("Tuple"),
                    json.string("Map"),
                    json.string("All of the above"),
                  ],
                  of: fn(i) { i },
                ),
              ),
              #("correct_answer_index", json.int(3)),
            ]),
          ),
        ]),
      ),
    ])
  encoded_json
  |> should.equal(expected_json)
}
