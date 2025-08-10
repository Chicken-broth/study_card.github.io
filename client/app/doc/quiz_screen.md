# Quiz Screen 仕様書

このドキュメントは `quiz_screen.gleam` モジュールの仕様を定義します。
このモジュールは、ユーザーがクイズに回答するためのUIとロジックを管理します。

## 1. 責務

-   渡された問題リストに基づき、クイズを1問ずつ表示する。
-   `question` モジュールと連携し、ユーザーの回答を受け付け、正誤を判定する。
-   クイズの進行状況（現在の問題、スコア）を管理する。
-   すべての問題が終了したら、クイズ終了画面を表示する。
-   問題形式ごとの詳細な状態管理やUIレンダリングは `question` モジュールに委譲する。

## 2. 状態管理 (`Model`)

クイズ画面の状態は `Model` レコードで管理されます。

| フィールド名            | 型                       | 説明                                               |
| ----------------------- | ------------------------ | -------------------------------------------------- |
| `current_question`      | `question.Model`         | 現在表示されている問題の状態。                     |
| `remaining_questions`   | `List(question.Model)`   | これから出題される問題のリスト。                   |
| `quiz_finished`         | `Bool`                   | クイズが終了したかどうかを示すフラグ。             |
| `user_answers`          | `List(#(String, Answer))` | ユーザーの回答履歴（問題IDと正誤結果）。           |
| `score`                 | `Int`                    | ユーザーの現在のスコア。                           |
| `total_questions`       | `Int`                    | クイズの総問題数。                                 |

## 3. メッセージ (`Msg`)

クイズ画面の状態を変更するために、以下のメッセージが使用されます。

| メッセージ           | ペイロード          | 説明                                               |
| -------------------- | ------------------- | -------------------------------------------------- |
| `QuestionMsg`        | `question.Msg`      | 現在の問題コンポーネントからのメッセージをラップする。 |
| `NextQuestion`       | なし                | 「Next」ボタンがクリックされたときに発行される。     |
| `GoToResultScreen`   | なし                | クイズ終了画面で「View Results」ボタンがクリックされたとき。 |

## 4. 更新ロジック (`update`)

`update` 関数は、メッセージを受け取って状態を更新します。

-   **`init`**: `List(question.Model)` を受け取り、最初の問題を `current_question` に、残りを `remaining_questions` に設定して `Model` の初期状態を生成します。
-   **`QuestionMsg`**: 受け取った `question.Msg` を `question.update` 関数に渡し、`current_question` の状態を更新します。
-   **`NextQuestion`**:
    1.  `question.check_answer` を使って現在の問題の正誤を判定し、スコアと回答履歴 (`user_answers`) を更新します。
    2.  `remaining_questions` から次の問題を取り出し、新しい `current_question` に設定します。
    3.  `remaining_questions` が空だった場合、`quiz_finished` フラグを `True` に設定します。

## 5. ビュー (`view`)

`view` 関数は、現在の状態に基づいてUIをレンダリングします。

-   **クイズ進行中 (`quiz_finished` が `False`)**: `view_question` が呼び出されます。
    -   進捗（例: `Question 1 of 10`）と問題文が表示されます。
    -   問題のインタラクション部分は `question.view` にレンダリングを委譲します。
    -   「Next」ボタンが表示されます。このボタンは `question.is_answered` が `True` を返すまで無効化されます。
-   **クイズ終了後 (`quiz_finished` が `True`)**: `view_quiz_finished` が呼び出されます。
    -   「Quiz Finished!」というメッセージと、最終スコア（例: `Your score: 8/10`）が表示されます。
    -   結果詳細画面へ遷移するための「View Results」ボタンが表示されます。