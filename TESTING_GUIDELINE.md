# Gleam テストガイドライン

このドキュメントは、本プロジェクトにおけるGleamのテストコード記述に関するガイドラインを定めます。品質の高いソフトウェアを維持するために、このガイドラインに従ってください。

## 1. 基本方針

-   **フレームワーク**: テストには `gleeunit` を使用します。
-   **アサーション**: 値の検証には `gleeunit/should` を使用します。
-   **独立性**: 各テストは他のテストから独立しており、実行順序に依存しないようにします。
-   **明確性**: 1つのテスト関数では、1つの関心事のみを検証します。例えば、正常系と異常系のテストは別の関数に分割します。

## 2. ファイル構成と命名規則

### 2.1. テストファイル

-   テストファイルはプロジェクトルートの `test/` ディレクトリに配置します。
-   ソースファイル `src/my_module.gleam` に対応するテストは `test/my_module_test.gleam` というファイル名にします。

### 2.2. テスト関数

-   テスト対象の関数や機能が明確にわかるように命名します。
-   テスト関数名の末尾には `_test` を付けます。
-   テストの目的（成功、失敗、特定の条件など）を名前に含めることを推奨します。

```gleam
// 良い例
pub fn decoder_success_test() { ... }
pub fn decoder_fail_on_missing_field_test() { ... }
pub fn to_json_roundtrip_test() { ... }

// 悪い例
pub fn test1() { ... }
pub fn decoder_test() { ... } // 複数のケースを1つのテストに混ぜない
```

## 3. テストの構造

各テストファイルは、`gleeunit` の作法に従います。

```gleam
import gleeunit
import gleeunit/should
// ... 他のimport

// テストランナーのエントリーポイント
pub fn main() {
  gleeunit.main()
}

// テストケース
pub fn my_feature_test() {
  // setup
  let expected = 4
  let actual = my_module.add(2, 2)

  // assertion
  actual |> should.equal(expected)
}
```

## 4. モックデータの活用

外部システム（API、データベースなど）への依存をなくし、テストの再現性と安定性を高めるためにモックデータを使用します。

### 4.1. モックファイルの作成

-   モックデータはJavaScriptファイルとして `test/mockData.mjs` に定義します。
-   データは `export const` を使って公開します。

### 4.2. モックデータの命名規則

-   **正常系データ**: `valid` を接頭辞につけます。（例: `validCategory`）
-   **異常系データ**: `invalid` を接頭辞につけ、続けて **何が不正なのか** を具体的に記述します。（例: `invalidCategoryMissingName`, `invalidQuestionWrongType`）

### 4.3. Gleamからの利用

-   `@external` アトリビュートを使って、JavaScriptのモックデータを `gleam/dynamic.Dynamic` 型としてインポートします。
-   インポートしたデータは、デコーダーのテストに直接使用します。

```gleam
// test/category_test.gleam
import gleam/dynamic
import gleam/dynamic/decode

@external(javascript, "./mockData.mjs", "validCategory")
fn get_valid_category_dynamic() -> dynamic.Dynamic

pub fn decoder_success_test() {
  get_valid_category_dynamic()
  |> decode.run(category.decoder())
  |> should.be_ok // ...
}
```

## 5. 推奨されるテストパターン

### 5.1. デコード・エンコードテスト

JSONや外部データ構造との変換を行う型については、以下のテストを記述します。

-   **デコード成功テスト**: 正常なデータから正しく型を生成できることを確認します。
-   **デコード失敗テスト**:
    -   必須フィールドが欠けているデータ
    -   フィールドの型が異なるデータ
    -   など、想定される不正なデータ形式で、デコードが `Error` となることを確認します。
-   **エンコードテスト**: 型から正しいJSON構造を生成できることを確認します。
-   **ラウンドトリップテスト**: `正常なデータ -> デコード -> エンコード -> 元のデータ構造と一致` することを確認し、デコーダーとエンコーダーの整合性を保証します。

```gleam
/// デコードしたデータを再度エンコードし、元のJSON構造と一致するかをテストします。
pub fn decode_then_encode_test() {
  // 1. モックから正常なデータを取得し、デコードする
  let assert Ok(decoded) =
    get_valid_category_dynamic()
    |> decode.run(category.decoder())

  // 2. 再度JSONにエンコードする
  let encoded_json = category.to_json(decoded)

  // 3. 期待されるJSON構造と比較する
  let expected_json =
    json.object([#("id", json.int(1)), #("name", json.string("Gleam基礎"))])
  encoded_json
  |> should.equal(expected_json)
}
```

## 6. テストの実行

プロジェクトのルートディレクトリで以下のコマンドを実行します。

```sh
gleam test
```