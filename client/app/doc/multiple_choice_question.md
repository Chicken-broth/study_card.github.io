# `multiple_choice_question` モジュール仕様書

このドキュメントは `multiple_choice_question.gleam` モジュールの仕様を概説します。このモジュールは、単一の四択問題の状態とUIを管理する、自己完結したLustreコンポーネントです。

## 1. アーキテクチャ

このモジュールは **The Elm Architecture (TEA)** に従っています。これは以下の主要な要素で構成されます。

-   **Model**: コンポーネントの状態を表します。
-   **Msg**: 状態を変更することができるユーザーのアクションやイベントを表します。
-   **`init`**: コンポーネントの状態を初期化する関数です。
-   **`update`**: `Msg` に基づいて状態を更新する関数です。
-   **`view`**: 現在の状態に基づいてUIを描画する関数です。

## 2. 型定義

### `pub type Msg`

`update` 関数が処理するメッセージを表します。

```gleam
pub type Msg {
  Select(Int)
}
```

-   `Select(Int)`: ユーザーが選択肢のボタンのいずれかをクリックしたときに発行されます。ペイロードの `Int` は、選択された選択肢の0から始まるインデックスです。

### `pub type AnswerState`

ユーザーの解答の状態を表します。

```gleam
pub type AnswerState {
  Correct
  Incorrect
  NotAnswered
}
```

-   `Correct`: ユーザーの選択が正解です。
-   `Incorrect`: ユーザーの選択が不正解です。
-   `NotAnswered`: ユーザーはまだ選択を行っていません。

### `pub type MultipleChoiceQuestion`

単一の四択問題の静的なデータを定義します。

```gleam
pub type MultipleChoiceQuestion {
  MultipleChoiceQuestion(
    texts: List(String),
    correct_answer_index: Int,
  )
}
```

-   `texts`: 各選択肢のテキストである文字列のリストです。
-   `correct_answer_index`: `texts` リスト内での正解の0から始まるインデックスです。

### `pub type Model`

任意の時点でのコンポーネントの完全な状態を表します。

```gleam
pub type Model {
  Model(
    question: MultipleChoiceQuestion,
    selected_index: Option(Int),
    answerr: Answer,
  )
}
```

-   `question`: 静的な問題データです。
-   `selected_index`: ユーザーが選択した選択肢のインデックスです。選択が行われるまでは `None` です。
-   `answerr`: ユーザーの解答の現在の状態（`Correct`、`Incorrect`、または `NotAnswered`）です。

## 3. 関数

### `pub fn init(question: MultipleChoiceQuestion) -> Model`

コンポーネントの状態を初期化します。問題データを受け取り、初期状態を「未解答」に設定します。

### `pub fn update(model: Model, msg: Msg) -> Model`

状態遷移を処理します。`Select(index)` メッセージを受け取ると、以下の処理を行います。
1.  選択された `index` が `correct_answer_index` と一致するかどうかを確認します。
2.  `answerr` を `Correct` または `Incorrect` に更新します。
3.  `selected_index` を選択されたインデックスで更新します。
4.  新しい `Model` を返します。

### `pub fn view(model: Model) -> Element(Msg)`

現在の `Model` に基づいてUIを描画します。各選択肢に対応するボタンのリストを表示します。ボタンの外観（例：背景色）は `selected_index` と `answerr` に基づいて変化します。

-   **スタイリング**: スタイリングは `attribute.style` を使用したインラインスタイルによって完全に行われます。
-   **インタラクティビティ**:
    -   各ボタンは、クリックされると `Select` メッセージを発行します。
    -   選択肢が一度選択されると、答えの変更を防ぐためにすべてのボタンが無効になります。

### `pub fn to_json(mcq: MultipleChoiceQuestion) -> json.Json`

`MultipleChoiceQuestion` レコードをJSONオブジェクトにシリアライズします。フォーマットは以下の通りです。

```json
{
  "texts": ["選択肢1", "選択肢2", ...],
  "correct_answer_index": 0
}
```

### `pub fn decode() -> dynamic.Decoder(MultipleChoiceQuestion)`

（上記のフォーマットの）JSONオブジェクトを `MultipleChoiceQuestion` レコードにパースするためのデコーダを提供します。