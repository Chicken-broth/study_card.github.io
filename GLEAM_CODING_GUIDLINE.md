# Gleam コーディングガイドライン

## 1. 基本的な言語機能と構文

-   **不変性 (Immutability)**: Gleamのデータ構造はすべて不変です。データを変更する場合は、必ず新しいレコードやリストを作成してください。
    -   レコードの更新は `Model(..model, field: new_value)` のようにスプレッド構文を使います。
    -   フィールド名と変数名が同じ場合は `Model(..model, field:)` のように省略できます。
-   **`if`文の代わりに`case`式**: 条件分岐には`if`文は存在せず、`case`式を使用します。
    ```gleam
    case a > b {
      True -> "a is greater"
      False -> "a is not greater"
    }
    ```
-   **`use`構文の活用**: `Result`型や`Option`型を扱う際は、ネストした`case`式を避けるために`use`構文を積極的に利用してください。コードがクリーンになります。
    ```gleam
    pub fn process_data() -> Result(Int, String) {
      use value1 <- first_step()
      use value2 <- second_step(value1)
      third_step(value2)
    }
    ```
-   **型定義**: 型には`type`、外部に公開しない型には`opaque type`を使用します。型名は`PascalCase`で記述します。
-   **関数ラベル**: 関数を呼び出す際は、引数にラベルを付けます。 `my_function(label: value)`

## 2. プロジェクト固有の規約

-   **アーキテクチャ**: このプロジェクトは **Lustre** フレームワークを使用しており、TEA (The Elm Architecture) に従います。
    -   `Model`: コンポーネントの状態を定義します。
    -   `Msg`: ユーザーのアクションやイベントを定義します。
    -   `init`: `Model`の初期状態を返します。
    -   `update`: `Msg`を受け取り、`Model`を更新します。
    -   `view`: `Model`を元にUIを描画します。
-   **命名規則**:
    -   関数名、変数名: `snake_case` (例: `get_user_name`)
    -   型名: `PascalCase` (例: `QuizAppModel`)
-   **ディレクトリ構造**:
    -   型定義は `src/types.gleam` に集約します。
    -   テストは `test/` ディレクトリに、元ファイルに対応する形で作成します。

## 3. ベストプラクティスとスタイル

-   **パイプ演算子 `|>`**: 複数の関数を連続して適用する場合は、パイプ演算子 `|>` を使って可読性を高めてください。
    ```gleam
    // 悪い例: a(b(c(d)))
    // 良い例: d |> c |> b |> a
    ```
-   **ドキュメンテーション**: 公開（`pub`）するすべての関数と型には、`///` から始まるドキュメンテーションコメントを記述してください。
-   **パターンマッチ**: `case`式では、すべての可能性を網羅するようにしてください。Gleamコンパイラが網羅性をチェックしてくれます。
-   **モジュール分割**: 1つのファイル（モジュール）は、1つの関心事に集中するようにしてください。

## 4. JavaScriptとの連携 (Promise)

GleamからJavaScriptのPromiseを扱う場合は `gleam/javascript/promise` モジュールを利用します。

-   **`promise.map(Promise(a), fn(a) -> b) -> Promise(b)`**:
    Promiseが成功した場合に、その結果に対して同期的な関数を適用します。新しい非同期処理は生成しません。

-   **`promise.map_try(Promise(Result(a, e)), fn(a) -> Result(b, e)) -> Promise(Result(b, e))`**:
    Promiseが `Ok` の結果を返した場合にのみ、後続の関数を適用します。`Error` の場合は関数をスキップし、エラーをそのまま伝播させます。

-   **`promise.await(Promise(a), fn(a) -> Promise(b)) -> Promise(b)`**:
    依存関係のある非同期処理を連結するために使用します。最初のPromiseの完了を待ってから、次のPromiseを返す関数を実行します。

-   **`promise.try_await(Promise(Result(a, e)), fn(a) -> Promise(Result(b, e))) -> Promise(Result(b, e))`**:
    `Result`を返すPromiseを連結します。前の処理が `Ok` の場合にのみ次の非同期処理を実行するため、失敗する可能性のある非同期処理を安全に繋げることができます。

-   **`promise.tap(Promise(a), fn(a) -> Nil) -> Promise(a)`**:
    Promiseチェーンの途中で、結果に影響を与えずに副作用を実行します。主にデバッグ目的で、中間値をコンソールに出力する際などに便利です。

-   **サンプルコード**:
    `use` 構文と組み合わせることで簡潔に記述できます。

    ```gleam
    import gleam/javascript/promise.{type Promise}
    import gleam/result
    import gleam/js // js.logを使うために必要
    type User = String
    @external(javascript, "./user_api.mjs", "fetch_user")
    fn fetch_user(id: Int) -> Promise(dynamic.Dynamic)

    fn get_user_posts(id: Int, decoder: decode.Decoder(User)) {
    use user <- promise.tap(fetch_user(id))
    let decoded =
        decode.run(user, decoder)
        |> result.map_error(json.UnableToDecode)
    echo decoded
    Nil
    }
    ```

    `gleeunit`での非同期テストの例です。`map`や`await`を使って値を取り出し、`should`でアサーションを行います。

    ```gleam
    // gleeunitでの非同期テストの例
    @external(javascript, "./indexedDB_ffi.mjs", "setup")
    pub fn setup(db_name: String) -> Promise(DB)
    @external(javascript, "./indexedDB_ffi.mjs", "get")
    fn get_users(db: DB) -> Promise(Dynamic)

    pub fn get_question_by_id_test() {
        use db <- promise.tap(setup("db_test"))
        use dynamic <- promise.tap(get_users(db))
        question.decode_question_list(dynamic)
        should.be_ok
        Nil
    }
    ```
    
    PromiseをEffectに変換する例:
    ```gleam
    pub type Msg {
    PromiseSuccess(Nil)
    PromiseFailure(String)
    }

    fn set_promise(promise: Promise(Result(Nil, String)), dispatch: fn(Msg) -> Nil) -> Nil {
    promise
    |> promise.map(fn(result) {
        //resultをMsgに変換
        case result {
        Ok(Nil) -> PromiseSuccess(Nil)
        Error(err) -> PromiseFailure(err)
        }
    })
    |> promise.tap(dispatch)
    Nil
    }
    /// Promise(Result(Nil, String))をEffect(Msg)に変換
    fn promise_to_effect(promise: Promise(Result(Nil, String))) -> Effect(Msg) {
    effect.from(set_promise(promise,_))
    }
    ```

## 5. 主要なライブラリとフレームワーク

-   **UIフレームワーク**: `lustre` を使用します。UIの描画は `lustre/element/html` を、イベントは `lustre/event` を、属性は `lustre/attribute` を使います。
-   **JSONの扱い**:
    -   JSONへの **変換（エンコード）** には `gleam/json` を使用します。関数名は `to_json` という命名規則に従います。
    -   JSON文字列の **解析（デコード）** には `gleam/json` の `json.parse` 関数を使用します。デコーダ自体の定義には `gleam/dynamic/decode` を使用します。

## 6. テスト

テストに関する規約は `TESTING_GUIDELINE.md` を参照してください。