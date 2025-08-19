// 正しい形式のカテゴリデータ
export function validCategory() {
  return {
    id: 1,
    name: "Gleam基礎",
  };
}

// 不正な形式のカテゴリデータ（nameプロパティが欠けている）
export function invalidCategoryMissingName() {
  return {
    id: 2,
    nam: "Lustre基礎", // 'name' のタイポ
  };
}

// 不正な形式のカテゴリデータ（idが文字列）
export function invalidCategoryIdAsString() {
  return {
    id: "1",
    name: "Gleam基礎",
  };
}

// 正しい形式の質問データ（多肢選択式）
export function validMultipleChoiceQuestion() {
  return {
    id: 1,
    category: {
      id: 1,
      name: "Gleam基礎",
    },
    question_text: "Gleamの型で、不変なデータ構造を表現するものはどれ？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["List", "Tuple", "Map", "All of the above"],
        correct_answer_index: 3,
      },
    },
  };
}

// 正しい形式の質問データ（関連付け）
export function validAssociationQuestion() {
  return {
    id: 2,
    category: {
      id: 2,
      name: "Lustre基礎",
    },
    question_text: "LustreのTEA（The Elm Architecture）の構成要素を対応付けなさい。",
    question_interaction: {
      type: "Association",
      data: [
        { id: 1, left: "Model", right: "状態" },
        { id: 2, left: "View", right: "UIの描画" },
        { id: 3, left: "Update", right: "状態の更新" },
      ],
    },
  };
}

// 不正な形式の質問データ（interactionのtypeが不正）
export function invalidQuestionWrongInteractionType() {
  return {
    id: 3,
    category: {
      id: 1,
      name: "Gleam基礎",
    },
    question_text: "Gleamの型で、不変なデータ構造を表現するものはどれ？",
    question_interaction: {
      type: "Multiple_Choice", // 不正な値
      data: {
        texts: ["List", "Tuple", "Map", "All of the above"],
        correct_answer_index: 3,
      },
    },
  };
}

// 不正な形式の質問データ（correct_answer_indexが文字列）
export function invalidQuestionWrongAnswerIndexType() {
  return {
    id: 4,
    category: {
      id: 1,
      name: "Gleam基礎",
    },
    question_text: "Gleamの型で、不変なデータ構造を表現するものはどれ？",
    question_interaction: {
      type: "MultipleChoice",
      data: {
        texts: ["List", "Tuple", "Map", "All of the above"],
        correct_answer_index: "3", // 不正な型
      },
    },
  };
}
