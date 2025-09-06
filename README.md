# Study Card (クイズアプリケーション)

<!-- 
[![Build Status](https://img.shields.io/ci/your-ci-service/user/repo.svg)](https://your-ci-service.com/user/repo)
-->

このリポジトリは、GleamとTypeScriptを使用して開発されるWebベースのクイズアプリケーションです。

## 1. プロジェクト概要

ユーザーが様々な形式の問題（四択、組み合わせ問題など）に挑戦し、結果を確認し、学習の進捗を追跡できるアプリケーションの開発を目指します。

## 2. 技術スタック

-   **フロントエンド**:
    -   言語: **Gleam**
    -   フレームワーク: **Lustre**
-   **バックエンド**:
    -   プラットフォーム: **Firebase Functions** (TypeScript)
    -   データベース: **Cloud Firestore**

## 3. 開発環境のセットアップ (Development Setup)

### 前提条件 (Prerequisites)

開発を始める前に、以下のツールがインストールされていることを確認してください。

-   [Gleam](https://gleam.run/getting-started/)
-   [Node.js](https://nodejs.org/) (LTS版を推奨)
-   [Firebase CLI](https://firebase.google.com/docs/cli)

### インストール (Installation)

1.  **リポジトリをクローンします:**
    ```sh
    git clone <repository-url>
    cd study_card
    ```

2.  **フロントエンドの依存関係をインストールします:**
    ```sh
    cd client/quiz_app
    gleam deps download
    ```

3.  **バックエンドの依存関係をインストールします:**
    ```sh
    cd ../../server
    npm install
    ```

### 開発サーバーの起動 (Running the Dev Server)

-   **フロントエンド (Gleam/Lustre):**
    ```sh
    cd client/quiz_app
    gleam run -m lustre/dev
    ```

-   **バックエンド (Firebase Functions):**
    Firebase Emulator Suiteを使用してローカルで関数をテストすることをおすすめします。
    ```sh
    cd server
    firebase emulators:start
    ```

### テストの実行 (Running Tests)

フロントエンドのテストは以下のコマンドで実行できます。
```sh
gleam test
```

## 4. ディレクトリ構成

```
.
├── client/              # フロントエンド (Gleam/Lustre)
│   └── app/
│       ├── src/         # ソースコード
│       └── test/        # テストコード
├── docs/                # プロジェクトドキュメント
│   ├── design/          # 設計書 (API仕様など)
│   ├── spec/            # 要件定義書
│   └── tasks/           # タスクリスト
├── server/              # バックエンド (Firebase Functions)
├── README.md            # このファイル
├── GEMINI.md            # AIアシスタント向け指示書
├── GLEAM_CODING_GUIDLINE.md # Gleamコーディング規約
└── TESTING_GUIDELINE.md   # Gleamテスト規約
```

## 4. はじめに (開発者向け)

開発を始める前に、以下のドキュメントに目を通し、プロジェクトの規約と仕様を理解してください。

-   **`/docs`**: プロジェクトの仕様書、設計書、タスクリストが格納されています。
-   **`GLEAM_CODING_GUIDLINE.md`**: フロントエンド(Gleam)のコーディング規約です。
-   **`TESTING_GUIDELINE.md`**: フロントエンド(Gleam)のテスト規約です。

AIアシスタントと協業する際の方針については `GEMINI.md` を参照してください。
