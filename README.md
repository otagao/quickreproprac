# Sketch Practice Tool

高頻度で参照画像をランダムに切り替えながらイラストの模写を練習するためのツールです。

## 特徴

- 参照画像の自動ランダム切り替え
- 画像と同じアスペクト比のキャンバス
- 複数フォルダからの画像読み込み
- カスタマイズ可能な切り替えタイマー
- シンプルな描画ツール（ペン、消しゴム）
- Undo/Redo機能（Ctrl+Z / Ctrl+Y）
- クロスプラットフォーム対応（Windows / macOS）

## システム要件

- Node.js v14 以降
- モダンなWebブラウザ（Chrome, Firefox, Safari, Edge）

## インストール

1. リポジトリをクローンまたはダウンロード

2. 依存関係をインストール:
```bash
npm install
```

## 使い方

### 1. 画像の準備

アプリケーションフォルダ内に、参照画像を含むフォルダを作成します:

```
quickreproprac/
├── reference_images/
│   ├── image1.jpg
│   ├── image2.png
│   └── ...
├── practice_photos/
│   ├── photo1.jpg
│   └── ...
├── server.js
└── ...
```

対応画像形式: JPG, JPEG, PNG, GIF, BMP, WEBP

### 2. サーバーの起動

```bash
npm start
```

サーバーが起動したら、コンソールに表示されるURL（通常は `http://localhost:3000`）にアクセスします。

### 3. アプリケーションの操作

#### フォルダ選択
1. 左側のパネルで、画像を読み込みたいフォルダを選択（複数選択可）
2. 「Load Images」ボタンをクリック

#### タイマー設定
- **Switch Interval**: 画像切り替えまでの時間を秒単位で設定
- **Start Auto-Switch**: 自動切り替えを開始
- **Stop**: 自動切り替えを停止
- **Next Image**: 手動で次の画像に切り替え

#### 描画ツール
- **Pen Color**: ペンの色を選択
- **Pen Size**: ペンの太さを調整（1-50px）
- **Pen/Eraser**: ペンモードと消しゴムモードを切り替え
- **Clear Canvas**: キャンバスをクリア

#### キーボードショートカット
- **Ctrl+Z** (Mac: Cmd+Z): 最後のストロークを取り消し（Undo）
- **Ctrl+Y** (Mac: Cmd+Y): 取り消したストロークを復元（Redo）
- **Ctrl+Shift+Z** (Mac: Cmd+Shift+Z): 取り消したストロークを復元（Redo）

## プロジェクト構成

```
quickreproprac/
├── server.js           # Node.jsサーバー
├── package.json        # プロジェクト設定
├── public/
│   ├── index.html     # メインHTML
│   ├── style.css      # スタイルシート
│   └── app.js         # フロントエンドロジック
└── README.md          # このファイル
```

## 技術スタック

- **バックエンド**: Node.js + Express
- **フロントエンド**: HTML5 Canvas + Vanilla JavaScript
- **スタイル**: CSS3

## ライセンス

MIT License

## トラブルシューティング

### 画像が表示されない
- フォルダ内に対応形式の画像があることを確認
- フォルダが選択されていることを確認
- ブラウザのコンソールでエラーメッセージを確認

### サーバーが起動しない
- Node.jsがインストールされているか確認: `node --version`
- ポート3000が使用されていないか確認
- `npm install`を実行して依存関係をインストール

### 描画が遅い
- ブラウザのハードウェアアクセラレーションが有効か確認
- 画像サイズが大きすぎないか確認（推奨: 2000px以下）

## 開発

機能追加やバグ修正の貢献を歓迎します。

---

Happy sketching!
