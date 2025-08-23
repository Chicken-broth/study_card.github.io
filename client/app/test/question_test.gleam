import core/association_question as association
import core/question
import gleam/dynamic
import gleam/dynamic/decode
import gleam/json
import gleam/list
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

/// 組み合わせ問題の選択肢がシャッフルされていることをテストします
pub fn shuffled_association_question_test() {
  let assert Ok(decoded_question) =
    get_valid_as_question_dynamic()
    |> decode.run(question.decoder())

  // シャッフルされていることをアサート (元の順序と異なることを確認)
  // 非常に低い確率で元の順序と同じになる可能性があるが、テストとしては許容範囲
  let assert question.Association(association) =
    decoded_question.question_interaction
  echo association
  list.map2(association.left, association.right, fn(l, r) { l.id != r.id })
  |> list.any(fn(a) { a })
  |> should.be_true

  let original_associatiod: association.Model =
    [
      association.Pair(1, "Model", "状態"),
      association.Pair(2, "View", "UIの描画"),
      association.Pair(3, "Update", "状態の更新"),
    ]
    |> association.init
  list.map2(original_associatiod.left, original_associatiod.right, fn(l, r) {
    l.id != r.id
  })
  |> list.any(fn(a) { a })
  |> should.be_true
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
        json.object([
          #("id", json.int(1)),
          #("name", json.string("Gleam基礎")),
          #("sub_id", json.int(1)),
          #("sub_name", json.string("")),
        ]),
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
