# データベース移行タスクリスト: Local Storage から Cloud Firestore へ

## 目的
アプリケーションのデータストレージをLocal Storageから最終ターゲットであるCloud Firestoreへ完全に移行する。

## 移行の優先順位
- まず `category` 関連のデータ移行とロジック更新を完了させる。
- 次に `questions` 関連のデータ移行とロジック更新を行う。

## 移行タスク

### 1. 現状のデータストレージの確認と分析
- [ ] フロントエンド（Gleam/Lustre）におけるLocal Storageの使用箇所を特定する。
  - [ ] どのデータがLocal Storageに保存されているかを確認する。
  - [ ] Local Storageに保存されているデータのスキーマを把握する。
- [ ] `client/app/src/ffi.mjs`におけるFirestoreの現在の設定（エミュレータ接続など）を確認する。

### 2. Firebaseプロジェクト設定の更新
- [ ] `client/app/src/ffi.mjs`内のFirebase設定（`firebaseConfig`）を、本番環境のFirebaseプロジェクトの認証情報に更新する。
  - [ ] `connectFirestoreEmulator`の呼び出しを、本番環境デプロイ時には無効化または条件付きにする。

### 3. データ移行戦略の策定と実装（必要な場合）
- [ ] Local Storageに永続化すべきデータが存在する場合、そのデータをCloud Firestoreへ移行する戦略を策定する。
  - [ ] 既存ユーザーのデータ移行パスを考慮する。
  - [ ] 移行スクリプトまたは初回起動時のデータ同期ロジックの実装。

### 4. フロントエンドのデータ操作ロジックの更新
- [ ] Local Storageを直接操作しているすべての箇所を、`client/app/src/firestore.gleam`を介したFirestore操作に置き換える。
  - [ ] データの読み込み、書き込み、更新、削除がすべてFirestore経由で行われることを確認する。
  - [ ] Gleam側の型定義（`client/quiz_app/src/types.gleam`など）がFirestoreのデータ構造と一致していることを確認する。

### 5. バックエンド（Firebase Functions）の統合（該当する場合）
- [ ] バックエンド（`server/index.ts`など）がCloud Firestoreと正しく連携していることを確認する。
  - [ ] 本番環境のFirestoreインスタンスに接続するように設定されていることを確認する。
  - [ ] 必要なAPIエンドポイントがFirestoreと適切に通信していることを確認する。

### 6. テストと検証
- [ ] 移行後のアプリケーションがCloud Firestoreと正しく連携していることを確認するためのテスト計画を策定する。
  - [ ] 単体テスト（Gleam/JavaScript）の更新。
  - [ ] 結合テストおよびE2Eテストの実施。
  - [ ] 本番環境デプロイ前の最終テスト。

### 7. ドキュメントの更新
- [ ] `GEMINI.md`および関連する設計ドキュメント（`docs/design/quiz-app/`）を、Cloud Firestoreへの移行を反映して更新する。
