# Firestore REST API 要約

このドキュメントは、Cloud Firestore REST APIの主要な概念と使い方をまとめたものです。
完全なリファレンスは[公式ドキュメント](https://cloud.google.com/firestore/docs/reference/rest/)を参照してください。

## 1. エンドポイントの基本構造

すべてのAPIリクエストは、以下の基本URLから始まります。

```
https://firestore.googleapis.com/v1/
```

リソースへのパスは、この基本URLに続けて記述します。

**パスの構造:**
`projects/{projectId}/databases/{databaseId}/documents/[コレクションID]/[ドキュメントID]`

-   `{projectId}`: あなたのGoogle CloudプロジェクトID。
-   `{databaseId}`: データベースID（通常は `(default)`）。

**例（`categories`コレクションの`history`ドキュメント）:**
`projects/studyapp-9dcc6/databases/(default)/documents/categories/history`

## 2. 認証

REST APIを呼び出すには、リクエストに認証情報を含める必要があります。主な方法は2つです。

-   **Firebase Authentication IDトークン**: クライアントアプリでFirebase認証を使ってユーザーがログインしている場合に取得できます。
-   **Google Identity OAuth 2.0トークン**: サーバーサイドのアプリケーションなどで使用します。

これらのトークンを、HTTPリクエストの `Authorization` ヘッダーに `Bearer` トークンとして含めます。

```
Authorization: Bearer [ID_TOKEN or OAUTH2_TOKEN]
```

## 3. 主な操作 (CRUD)

### ドキュメントの取得 (`GET`)

指定したドキュメントのデータを取得します。

-   **メソッド**: `GET`
-   **URL**: `.../documents/{collectionId}/{documentId}`

### ドキュメントの作成 (`POST`)

コレクションに新しいドキュメントを追加します。ドキュメントIDはFirestoreが自動で採番します。

-   **メソッド**: `POST`
-   **URL**: `.../documents/{collectionId}`
-   **リクエストボディ**: 作成するドキュメントのフィールドをJSONで記述します。

### ドキュメントの上書き (`PATCH` with `documentId`)

特定のドキュメントIDを指定して、ドキュメントを作成または完全に上書きします。

-   **メソッド**: `PATCH`
-   **URL**: `.../documents/{collectionId}/{documentId}`
-   **リクエストボディ**: 作成/上書きするドキュメントのフィールドをJSONで記述します。

### ドキュメントの部分更新 (`PATCH` with `updateMask`)

ドキュメントの特定のフィールドだけを更新します。

-   **メソッド**: `PATCH`
-   **URL**: `.../documents/{collectionId}/{documentId}?updateMask.fieldPaths=[フィールド名]`
-   **リクエストボディ**: 更新するフィールドと値をJSONで記述します。

### ドキュメントの削除 (`DELETE`)

指定したドキュメントを削除します。

-   **メソッド**: `DELETE`
-   **URL**: `.../documents/{collectionId}/{documentId}`

## 4. ドキュメントのクエリ

`runQuery` メソッドを使って、条件に一致するドキュメントを検索します。

-   **メソッド**: `POST`
-   **URL**: `.../documents:runQuery`
-   **リクエストボディ**: クエリの条件（`where`, `orderBy`など）をJSONで記述します。
