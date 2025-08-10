# データフロー図

## ユーザーインタラクションフロー

```mermaid
flowchart TD
    subgraph User Interaction
        A[ユーザー] --> B{Home画面}
        B -- クイズ開始 --> C{クイズ画面}
        C -- 回答完了 --> D{リザルト画面}
        D -- Homeへ --> B
        B -- 学習履歴 --> E{集計画面}
        E -- Homeへ --> B
    end
## コンポーネント内部のデータフロー

### 四択問題 (MultipleChoiceQuestion)

1.  **初期状態**:
    -   `selected_index` は `None`。
    -   `answer` は `NotAnswered`。
2.  **ユーザーが選択肢 `index` を選択 (`Select(index)`メッセージ)**:
    -   **ケース1: 選択済みの選択肢を再クリック**:
        -   `model.selected_index` が `Some(index)` と一致する場合、選択を解除する。
        -   `selected_index` を `None` に更新する。
        -   `answer` を `NotAnswered` に更新する。
    -   **ケース2: 新しい選択肢をクリック**:
        -   `selected_index` を `Some(index)` に更新する。
        -   `index` が `correct_answer_index` と一致するか評価する。
        -   評価結果に基づき、`answer` を `Correct` または `Incorrect` に更新する。
3.  **ビューへの反映**:
    -   `answer` の状態に応じて、フィードバック（色やテキスト）を表示する。
        -   `Incorrect` の場合、選択した不正解の選択肢と、実際の正解の選択肢の両方をハイライトする。
        -   `Correct` の場合、正解の選択肢をハイライトする。
## データ処理フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド (Gleam/Lustre)
    participant B as バックエンド (Firebase Functions)
    participant DB as データベース (Firebase)

    U->>F: アプリケーションにアクセス
    F->>B: GET /api/categories (カテゴリ一覧の取得)
    B->>DB: SELECT * FROM categories
    DB-->>B: カテゴリデータを返却
    B-->>F: カテゴリ一覧をレスポンス
    F-->>U: Home画面を表示 (カテゴリ選択肢)

    U->>F: カテゴリと出題数を選択し、クイズ開始をクリック
    F->>B: GET /api/questions?categories=cat1,cat2&count=10 (問題の取得)
    B->>DB: カテゴリと数に基づいてクエリ実行
    DB-->>B: 問題データを返却
    B-->>F: 問題をレスポンス
    F-->>U: クイズ画面を表示

    U->>F: 回答を送信
    F->>F: 正解/不正解を判定
    Note right of F: クライアントサイドで判定

    U->>F: 全問回答完了
    F->>F: 結果を集計
    F-->>U: リザルト画面を表示
```