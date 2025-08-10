

## Gleam コーディングガイドライン

### 1. 基本的な言語機能と構文

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

### 2. プロジェクト固有の規約

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

### 3. ベストプラクティスとスタイル

-   **パイプ演算子 `|>`**: 複数の関数を連続して適用する場合は、パイプ演算子 `|>` を使って可読性を高めてください。
    ```gleam
    // 悪い例: a(b(c(d)))
    // 良い例: d |> c |> b |> a
    ```
-   **ドキュメンテーション**: 公開（`pub`）するすべての関数と型には、`///` から始まるドキュメンテーションコメントを記述してください。
-   **パターンマッチ**: `case`式では、すべての可能性を網羅するようにしてください。Gleamコンパイラが網羅性をチェックしてくれます。
-   **モジュール分割**: 1つのファイル（モジュール）は、1つの関心事に集中するようにしてください。

### 4. 主要なライブラリとフレームワーク

-   **UIフレームワーク**: `lustre` を使用します。UIの描画は `lustre/element/html` を、イベントは `lustre/event` を、属性は `lustre/attribute` を使います。
-   **JSONの扱い**:
    -   JSONへの **変換（エンコード）** には `gleam/json` を使用します。関数名は `to_json` という命名規則に従います。
    -   JSON文字列の **解析（デコード）** には `gleam/json` の `json.parse` 関数を使用します。デコーダ自体の定義には `gleam/dynamic/decode` を使用します。

### 5. ツールとワークフロー

-   **フォーマット**: すべてのコードは `gleam format` コマンドでフォーマットします。フォーマットの細かいスタイルは気にせず、ロジックに集中してください。
-   **テスト**: このプロジェクトのテストは `gleeunit` フレームワークを使用して記述します。
    -   **ファイル配置**: テストファイルはプロジェクトルートの `test/` ディレクトリに配置します。ソースファイル `src/my_module.gleam` に対応するテストは `test/my_module_test.gleam` という名前にします。
    -   **テストの構造**:
        -   各テストファイルには、テストランナーのエントリーポイントとして `pub fn main()` を定義します。
        -   `main` 関数内では、`gleeunit.main()` を呼び出します。この際、実行したいテスト関数のリストを引数として渡します。
        -   テストケースとなる関数は、関数名の末尾を `_test` にし、`pub` で公開します。これにより、テストランナーが自動的にテストを検出します。
        -   **`@test` 属性は使用しません。**
    -   **アサーション**: 値の検証には `gleeunit/should` モジュールを使用します。(`should.equal`, `should.be_ok`, `should.be_error` など)
    -   **実行**: テストはプロジェクトルートで `gleam test` コマンドを実行することで実行できます。
    -   **テストファイルの例:**
        ```gleam
        // test/my_module_test.gleam
        import my_module
        import gleeunit
        import gleeunit/should

        pub fn main() { gleeunit.main() }

        pub fn add_test() {
          my_module.add(2, 3)
          |> should.equal(5)
        }
        ```