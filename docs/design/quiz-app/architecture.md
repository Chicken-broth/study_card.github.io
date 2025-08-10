# クイズアプリ アーキテクチャ設計

## システム概要

本システムは、ユーザーが様々なクイズに挑戦し、学習を進めるためのWebアプリケーションである。フロントエンドとバックエンドを分離した構成とし、バックエンドはクイズデータを提供するAPIとして機能する。

## アーキテクチャパターン

- **パターン**: TEA (The Elm Architecture)
- **理由**: 
    - TEAは状態管理がシンプルで予測可能であり、アプリケーションの状態変更を追いやすく、バグの少ないコードを記述できる。
    - Gleam/LustreはTEAを基本パターンとしており、フレームワークの思想に沿った自然な設計が可能。

## コンポーネント構成

### フロントエンド

- **言語/フレームワーク**: Gleam / Lustre
- **状態管理**: TEA (Model, Update, View)
- **型定義ソース**: `interfaces.ts` を中間表現として利用し、Gleamの型を生成する。
- **DB**:Local Storage 

### バックエンド

- **フレームワーク**: Firebase Functions
- **データベース**: Firestore / Realtime Database (Firebase)
- **認証方式**: なし（本要件ではユーザー認証は不要）

### データストア

- **DBMS**: Local Storage (初期), Firebase Realtime Database (最終)
- **理由**: 
    - 開発初期段階ではLocal Storageを利用することで、バックエンドの準備を待たずにフロントエンド開発を迅速に進める。
    - その後、Firebase Realtime Databaseに移行することで、リアルタイム性のあるデータ同期とスケーラブルなバックエンドを実現する。
