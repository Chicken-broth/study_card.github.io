# クライアントサイドアーキテクチャ

このドキュメントでは、GleamとLustreで構築されたクイズアプリケーションのクライアントサイドアーキテクチャについて詳述します。

## 1. 概要

クライアントサイドは、静的型付け言語 **Gleam** と、そのUIフレームワークである **Lustre** を採用しています。アーキテクチャの核となるのは、Lustreが採用する **The Elm Architecture (TEA)** です。TEAは、状態の変更を予測可能にし、アプリケーションの保守性を高めるためのシンプルで強力なパターンです。

## 2. ディレクトリ構造

主要なソースコードは `client/app/src/` ディレクトリに配置されています。

-   `study_app.gleam`: アプリケーションのエントリーポイント。Lustreアプリケーションの起動処理を記述します。
-   `core/`: アプリケーションの核となるビジネスロジックとデータ型を定義します。
    -   `question.gleam`, `category.gleam` など、ドメインモデルに関連するモジュールが含まれます。
-   `pages/`: 各画面に対応するLustreコンポーネントを配置します。
    -   `quiz_home.gleam`, `quiz_screen.gleam`, `result_screen.gleam` など。
-   `interface/`: 外部システムとの連携（FFI）やAPIクライアントを定義します。
    -   `indexed_db.gleam`: IndexedDBのFFI定義。
    -   `indexedDB_ffi.mjs`: IndexedDBの具体的なJavaScript実装。
-   `utils/`: プロジェクト全体で再利用可能なヘルパー関数などを配置します。

## 3. The Elm Architecture (TEA)

アプリケーションの各コンポーネントは、TEAの3つの主要な要素で構成されます。

-   **`Model`**: コンポーネントの状態を表すデータ構造。不変（Immutable）です。
-   **`Msg`**: ユーザーの操作や非同期処理の結果など、状態を変更する可能性のあるすべてのイベントを定義した型。
-   **`init`**: `Model`の初期状態を生成する関数。
-   **`update(Msg, Model) -> Model`**: `Msg`を受け取り、現在の`Model`を元に新しい`Model`を返す純粋関数。状態の更新ロジックはすべてこの関数に集約されます。
-   **`view(Model) -> Element(Msg)`**: `Model`を引数に取り、HTMLの構造を返す関数。ユーザーが操作すると、対応する`Msg`が`update`関数に送信されます。

この一方向のデータフローにより、状態の変更がどこで発生したかを追跡しやすくなっています。

## 4. 副作用の管理

HTTPリクエストやデータベース操作などの副作用（Side Effect）は、`update`関数から直接実行されることはありません。代わりに、Lustreの`Effect`という仕組みを利用します。

1.  `update`関数は、状態更新後の`Model`と一緒に、実行したい副作用を記述した`Effect(Msg)`を返します。
2.  Lustreのランタイムがその`Effect`を受け取り、非同期処理を実行します。
3.  処理が完了すると、結果（成功または失敗）が`Msg`として再度`update`関数に送られます。

これにより、`update`関数は純粋なままで保たれ、テスト容易性が向上します。

## 5. データアクセス層 (IndexedDB)

クライアントサイドの永続化ストアとしてIndexedDBを利用しています。GleamからIndexedDBを操作するために、FFI（Foreign Function Interface）を使用しています。

具体的な関数（`setup`, `getQuestionIdList`など）の仕様については、[データフロー図のドキュメント](./dataflow.md#クライアントサイドデータアクセス-indexeddb)を参照してください。

## 6. JavaScriptとの連携 (FFI)

Gleamは、`@external`アトリビュートを介してJavaScriptの関数を安全に呼び出すことができます。このプロジェクトでは、`interface/indexedDB_ffi.mjs`に実装されたJavaScript関数を、`interface/indexed_db.gleam`で型定義を付けてインポートしています。

**例: `getQuestionIdList`**

-   **JavaScript実装 (`indexedDB_ffi.mjs`)**
    ```javascript
    export function getQuestionIdList(db) {
      return new Promise((resolve, reject) => {
        // ... IndexedDBからキーを取得する処理 ...
      });
    }
    ```

-   **GleamでのFFI定義 (`indexed_db.gleam`)**
    ```gleam
    import gleam/javascript/promise.{type Promise}

    @external(javascript, "./indexedDB_ffi.mjs", "getQuestionIdList")
    pub fn get_question_id_list(db: Db) -> Promise(List(String))
    ```

このように型定義を付けることで、GleamのコンパイラがJavaScript関数との間の型の不整合を検出し、実行時エラーを防ぎます。
