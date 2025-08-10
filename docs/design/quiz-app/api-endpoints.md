# API エンドポイント仕様

## 1. カテゴリ一覧取得

### `GET /api/categories` (Firebase Function)

 **説明**: Firebase Functions を介して、利用可能なすべてのクイズカテゴリを取得します。
 **リクエスト**: なし
 **レスポンス (200 OK)**:

```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "history", "name": "歴史" },
      { "id": "science", "name": "科学" },
      { "id": "sports", "name": "スポーツ" }
    ]
  }
}
```

## 2. 問題一覧取得

### `GET /api/questions`

 **説明**: 指定された条件に基づいてクイズの問題を取得します。
 **クエリパラメータ**:
    - `categories` (string, 必須): 取得したいカテゴリのIDをカンマ区切りで指定します。（例: `history,science`）
    - `count` (number, 必須): 取得したい問題数を指定します。（例: `10`）
 **レスポンス (200 OK)**:

```json
{
  "success": true,
  "data": {
    "questions": [
      // ... Questionオブジェクトの配列 ...
    ]
  }
}
```

## 3. 解答結果の送信

### `POST /api/quiz-results`

- **説明**: ユーザーのクイズ解答結果をサーバーに記録します。
- **リクエストボディ**:

```json
{
  "results": [
    {
      "question_id": "q1",
      "is_correct": true
    },
    {
      "question_id": "q2",
      "is_correct": false
    }
  ]
}
```

- **レスポンス (200 OK)**:

```json
{
  "success": true,
  "message": "Results saved successfully."
}
```

- **レスポンス (400 Bad Request)**: データが不正な場合

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATA",
    "message": "Invalid quiz result data."
  }
}
```

## 4. クイズ集計データの取得

### `GET /api/quiz-summary`

- **説明**: ユーザーのクイズ解答履歴から集計データを取得します。
- **リクエスト**: なし
- **レスポンス (200 OK)**:

```json
{
  "success": true,
  "data": {
    "overall_stats": {
      "total_questions_answered": 100,
      "average_correct_rate": 0.75
    },
    "category_stats": [
      {
        "category_id": "history",
        "category_name": "歴史",
        "total_questions_answered": 50,
        "correct_rate": 0.8
      },
      {
        "category_id": "science",
        "category_name": "科学",
        "total_questions_answered": 30,
        "correct_rate": 0.7
      }
    ]
  }
}
```
