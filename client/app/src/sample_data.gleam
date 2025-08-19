import core/association_question as as_question
import core/category.{type Category}
import core/multiple_choice_question as mc_question
import core/question

/// サンプルのカテゴリデータを返す。
pub const sample_categories: List(Category) = [
  category.Category(id: "gleam_basic", name: "Gleam基礎"),
  category.Category(id: "lustre_basic", name: "Lustre基礎"),
]

pub const sample_categories_string: String = "[{\"id\":\"gleam_basic\",\"name\":\"Gleam基礎\"},{\"id\":\"lustre_basic\",\"name\":\"Lustre基礎\"}]"

pub const sample_questions_string: String = "[{\"id\":\"4b6ab993-56d0-4825-a770-42bcd55f441e\",\"name\":\"テストタスク4\",\"created_at\":{\"seconds\":1754529730,\"nanoseconds\":0},\"segments\":[]}"

/// サンプルの問題データを返す。
pub fn sample_questions() -> List(question.Model) {
  [
    question.init(
      "q1",
      category.Category(id: "gleam_basic", name: "Gleam基礎"),
      "Gleamでイミュータブルな変数を定義するキーワードは？",
      question.MultipleChoice(mc_question.init(
        ["新しいModelとEffect", "ElementとView", "ModelとView", "新しいModelとMsg"],
        0,
      )),
    ),
    question.init(
      "q2",
      category.Category(id: "gleam_basic", name: "Gleam基礎"),
      "Gleamのパッケージマネージャーとして使われるツールは？",
      question.Association(
        as_question.init([
          as_question.Pair("1", "日本", "東京"),
          as_question.Pair("2", "アメリカ", "ワシントンD.C."),
          as_question.Pair("3", "イギリス", "ロンドン"),
        ]),
      ),
    ),
    question.init(
      "q3",
      category.Category(id: "lustre_basic", name: "Lustre基礎"),
      "Lustreアプリケーションの`update`関数が返すものは？",
      question.MultipleChoice(mc_question.init(
        ["let", "const", "var", "def"],
        0,
      )),
    ),
    question.init(
      "q4",
      category.Category(id: "lustre_basic", name: "Lustre基礎"),
      "LustreでHTML要素を生成するために使われるモジュールは？",
      question.Association(
        as_question.init([
          as_question.Pair("1", "html", "html"),
          as_question.Pair("2", "element", "element"),
          as_question.Pair("3", "attribute", "attribute"),
        ]),
      ),
    ),
  ]
}
