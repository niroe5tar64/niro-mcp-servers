# Confluence Cleaner 修正計画

## 1. 問題の特定

### 現状の誤った要件理解
**実装していた機能**: ConfluenceAPIを用いて取得したXML（Storage Format）をMarkdown形式のテキストに変換する

- `<ac:structured-macro>`, `<ac:rich-text-body>`, `<ri:page>` などの名前空間タグを処理
- XMLモード(`xml: { decodeEntities: false }`)でcheerioを使用
- `expandConfluenceMacrosWithCheerio()` 関数でAPI XML専用の処理を実装

### 正しい要件
**実装すべき機能**: Confluenceページ閲覧時にレンダリングされるHTMLをMarkdown形式のテキストに変換する

- 通常のHTML要素（div, span, p, h1-h6, table, etc.）
- Confluence固有のclass名（`confluence-content`, `expand-container`, `confluence-embedded-file-wrapper`, etc.）
- マクロは既にレンダリング済み（JavaScript/CSSで動作する形）
- `data-*` 属性でメタデータを保持

### ユーザー指示による方針確定
- **XML変換機能は完全削除** - API XML関連コードはすべて削除
- **サンプルHTML**: 現在のfixtureファイル2つのみ（今後増える可能性あり）
- **優先マクロ**: 特になし（必要になったら都度指示）
- **アプローチ**: 必要最小限の実装 + 拡張可能な構造

---

## 2. 入力データの違い

### Confluence Storage Format (API XML)
```html
<ac:structured-macro ac:name="info">
  <ac:rich-text-body>
    <p>Important information</p>
  </ac:rich-text-body>
</ac:structured-macro>

<ac:image ac:width="100">
  <ri:attachment ri:filename="sample.png" />
</ac:image>
```

### レンダリング後のHTML（ブラウザで表示されるもの）
```html
<div class="confluence-information-macro confluence-information-macro-information">
  <span class="aui-icon aui-icon-small aui-iconfont-info confluence-information-macro-icon"></span>
  <div class="confluence-information-macro-body">
    <p>Important information</p>
  </div>
</div>

<span class="confluence-embedded-file-wrapper confluence-embedded-manual-size">
  <img class="confluence-embedded-image"
       src="/download/attachments/123/sample.png"
       data-image-src="/download/attachments/123/sample.png"
       width="100">
</span>
```

**重要な違い**:
- API XML: 構造化された専用タグ（名前空間付き）
- レンダリング後HTML: 通常のHTML + class/data-*属性で情報を保持

---

## 3. 影響範囲の分析

### 削除または大幅修正が必要なコード

#### `src/index.ts`

**Line 175-234**: `expandConfluenceMacros()` 関数
- API XML形式の正規表現パターンマッチング
- `<ac:structured-macro>` の処理
- `data-macro-name` 属性の処理（これは残す可能性あり）

**Line 236-415**: `expandConfluenceMacrosWithCheerio()` 関数
- XMLモードでの処理全体
- `ac:structured-macro`, `ac:image`, `ac:layout` などの名前空間タグ処理
- この関数全体を削除または置き換え

**Line 428-462**: `expandMacro()` 関数
- 現在の形式は維持可能（HTML出力のため）
- ただし、呼び出し元がなくなる可能性

#### `src/index.test.ts`

**Line 305-366**: Confluence標準マクロ形式のテスト
- `<ac:structured-macro>` 形式のテストを全削除

**Line 368-397**: Confluence名前空間タグのテスト
- `<ac:layout>`, `<ac:image>`, `<time datetime>` のテストを削除

### 維持すべき機能

- `removeConfluenceMetadata()` (Line 143-170): class/style/data-*属性の削除 → **維持**
- `normalizeTableCells()` (Line 470-601): テーブル正規化 → **維持**
- `unescapeMarkdownInTables()` (Line 625-685): Markdown構文解除 → **維持**
- `convertRemainingHtmlTables()` (Line 691-784): HTMLテーブル変換 → **維持**
- `calculateTokenReduction()` (Line 801-814): トークン削減率計算 → **維持**

---

## 4. レンダリング後のHTML要素の調査

### Fixtureファイルから判明した要素

#### `page-2317999817.html` の分析

1. **Expandマクロ（展開可能セクション）**
```html
<div id="expander-788104425" class="expand-container">
  <div id="expander-control-788104425" class="expand-control" aria-expanded="false">
    <span class="expand-icon aui-icon aui-icon-small aui-iconfont-chevron-right">&nbsp;</span>
    <span class="expand-control-text conf-macro-render">ここをクリックすると展開されます...</span>
  </div>
  <div id="expander-content-788104425" class="expand-content expand-hidden">
    <p>展開される内容</p>
  </div>
</div>
```
→ **処理方針**: タイトルと中身を保持、アイコンは削除または絵文字化

2. **画像（confluence-embedded-file-wrapper）**
```html
<span class="confluence-embedded-file-wrapper confluence-embedded-manual-size">
  <img class="confluence-embedded-image confluence-external-resource"
       draggable="false"
       width="500"
       src="https://pbs.twimg.com/media/example.jpg"
       data-image-src="https://pbs.twimg.com/media/example.jpg">
</span>

<span class="confluence-embedded-file-wrapper confluence-embedded-manual-size">
  <img class="confluence-embedded-image confluence-thumbnail"
       draggable="false"
       width="300"
       src="/download/thumbnails/1000000000/image-2025-8-26_12-1-6.png?version=1&modificationDate=1756177266411&api=v2"
       data-image-src="/download/attachments/1000000000/image-2025-8-26_12-1-6.png?version=1&modificationDate=1756177266411&api=v2">
</span>
```
→ **処理方針**: ラッパーを削除し、img要素のみ保持してMarkdown画像構文に変換

3. **Page Tree マクロ**
```html
<div class="plugin_pagetree conf-macro output-inline" data-hasbody="false" data-macro-name="pagetree">
  <!-- 複雑なフォーム要素とJavaScript制御 -->
  <div id="pagetreesearch">...</div>
  <input type="hidden" name="treeId" value="" />
  <!-- 大量のhidden inputフィールド -->
</div>
```
→ **処理方針**: LLMには不要なので完全削除

4. **リンク（外部・内部）**
```html
<a href="https://example-slack.example.com/archives/C0000000000" class="external-link" rel="nofollow">
  #example-channel
</a>
```
→ **処理方針**: class属性を除去、通常のMarkdownリンクに変換

5. **スタイル付きテキスト**
```html
<span style="color: rgb(255,0,0);"><strong>【必読】運用方法（超重要）</strong></span>
```
→ **処理方針**: style属性を除去、strongはMarkdown **bold** に変換

#### `page-2570547984.html` の調査が必要
→ 他のマクロパターンがあるか確認

---

## 5. 修正計画（実装手順）

### Phase 1: 調査・分析（優先度: 高）

- [ ] **Task 1.1**: 両方のfixtureファイルの詳細分析
  - `page-2317999817.html` の全要素リストアップ
  - `page-2570547984.html` の全要素リストアップ
  - レンダリング後HTML固有の要素を特定

- [ ] **Task 1.2**: ~~実際のConfluenceページからサンプル収集（可能であれば）~~ **スキップ**
  - ユーザー指示: 現在サンプルなし、今後増えたら都度対応

- [ ] **Task 1.3**: 処理すべき要素の特定（優先順位なし）
  - Fixtureファイルに含まれる要素のみ対応
  - 今後必要に応じて都度追加

### Phase 2: コア機能の修正（優先度: 高）

- [ ] **Task 2.1**: XML変換機能の完全削除
  - `expandConfluenceMacros()` 関数を削除または簡素化
  - `expandConfluenceMacrosWithCheerio()` 関数を完全削除
  - `expandMacro()` 関数を削除（XML専用のため不要）
  - `SUPPORTED_MACRO_TYPES` を削除（XML専用のため不要）
  - `MacroType` 型定義を削除（XML専用のため不要）

- [ ] **Task 2.2**: レンダリング後HTML処理の実装（最小限）
  - Expandマクロ処理: `class="expand-container"` の検出と変換
  - 画像処理: `confluence-embedded-file-wrapper` の処理
  - Page treeマクロ削除: `class="plugin_pagetree"` の削除
  - **拡張可能な構造**: 新しいマクロ対応を追加しやすい設計

- [ ] **Task 2.3**: メイン処理フローの簡素化
  - `cleanConfluenceHtml()` の処理フローを整理
  - レンダリング後HTML専用の処理に特化

### Phase 3: テストの修正（優先度: 高）

- [ ] **Task 3.1**: XML関連テストの完全削除
  - Line 305-366: `<ac:structured-macro>` 形式のテスト削除
  - Line 368-397: Confluence名前空間タグのテスト削除
  - Line 215-284: `expandMacro()` 関数のテスト削除（関数自体を削除するため）

- [ ] **Task 3.2**: レンダリング後HTML形式のテストを追加
  - Expandマクロのテスト
  - 画像（confluence-embedded-file-wrapper）のテスト
  - Page treeマクロ削除のテスト
  - スタイル付きテキストのテスト

- [ ] **Task 3.3**: Fixtureベースのテストを強化
  - `page-2317999817.html` のテストケースを詳細化
  - `page-2570547984.html` のテストケースを詳細化
  - 期待される出力（Markdown）を明確に定義

### Phase 4: クリーンアップ（優先度: 中）

- [ ] **Task 4.1**: 不要なコード削除
  - `expandConfluenceMacrosWithCheerio()` 関数削除（完全に置き換え後）
  - `SUPPORTED_MACRO_TYPES` の見直し（まだ使われるか確認）
  - 不要なインポートやコメントの削除

- [ ] **Task 4.2**: コメント・ドキュメント更新
  - ファイルヘッダーのコメント更新
  - 関数のJSDocコメント更新
  - README.mdの更新

### Phase 5: 検証・最適化（優先度: 中）

- [ ] **Task 5.1**: 全テストのパス確認
  - `bun test` でエラーがないことを確認
  - カバレッジの確認

- [ ] **Task 5.2**: トークン削減率の検証
  - Fixtureファイルで50%前後の削減率が達成されているか確認
  - 必要に応じて処理を調整

- [ ] **Task 5.3**: パフォーマンステスト
  - 大きなHTMLファイルでの処理速度確認
  - メモリ使用量の確認

---

## 6. 技術的な考慮事項

### CheerioのXMLモードについて

**現在**:
```typescript
const $ = cheerio.load(html, {
  xml: { decodeEntities: false },  // XMLモード（API XML用）
});
```

**修正後**:
```typescript
const $ = cheerio.load(html, {
  xml: false,  // HTMLモード（レンダリング後HTML用）
});
```

### Class名ベースの処理パターン

レンダリング後HTMLではclass名が重要な情報源になります：

```typescript
// Expandマクロの検出例
$('.expand-container').each((_, el) => {
  const $control = $(el).find('.expand-control-text');
  const title = $control.text().trim();
  const $content = $(el).find('.expand-content');
  const body = $content.html() || '';

  // Markdownに変換
  $(el).replaceWith(`<details><summary>${title}</summary>\n\n${body}\n</details>`);
});
```

### メタデータ除去とのバランス

`removeMetadata: true` の場合、class属性を削除してしまうため、マクロ処理と除去の順序が重要：

1. **マクロ処理** (class名を使って要素を特定)
2. **メタデータ除去** (class/data-*属性を削除)
3. **Markdown変換**

現在の実装では、この順序が正しく実装されているため維持する。

---

## 7. リスク・懸念事項

### リスク 1: Confluenceバージョンによる差異
Confluenceのバージョンやインストール構成によってレンダリング後のHTMLが異なる可能性があります。

**対策**:
- 複数のサンプルHTMLを収集してパターンを特定
- 柔軟なセレクタ（複数のclass名パターンに対応）
- フォールバック処理の実装

### リスク 2: 既存の依存パッケージへの影響
`confluence-md` パッケージが既に本ライブラリを使用している可能性があります。

**対策**:
- `confluence-md` のテストも実行して互換性を確認
- 必要に応じて `confluence-md` 側も修正

### リスク 3: テストカバレッジの不足
fixtureファイルが限られているため、すべてのマクロパターンをカバーできない可能性があります。

**対策**:
- 段階的な実装（Phase 1で要素を特定してから実装）
- 未知の要素に対するフォールバック処理
- ログ出力で未処理要素を記録

---

## 8. 成功基準

### 必須条件（Phase 2完了時）
- [ ] 全テストがパスする（既存テストは削除・修正済み）
- [ ] Fixtureファイル2つでトークン削減率 40-60% を達成
- [ ] レンダリング後HTMLの主要要素（expand, 画像, テーブル）が正しく変換される

### 推奨条件（Phase 5完了時）
- [ ] テストカバレッジ 80% 以上
- [ ] README.mdに使用例とサポート要素の一覧が記載されている
- [ ] パフォーマンステストで大規模HTML（100KB以上）も処理可能

---

## 9. タイムライン（参考）

この計画は段階的に実装し、各Phaseの完了を確認してから次に進むことを推奨します：

1. **Phase 1 (調査)**: まず実施
2. **Phase 2 (実装)**: Phase 1完了後
3. **Phase 3 (テスト)**: Phase 2と並行可能
4. **Phase 4 (クリーンアップ)**: Phase 2-3完了後
5. **Phase 5 (検証)**: 最終フェーズ

---

## 10. 次のアクションアイテム

**即座に実施すべきこと**:
1. `page-2570547984.html` の詳細読み込みと分析
2. レンダリング後のInfo/Warning/Note/Tipマクロの形式を調査
3. Phase 1の完了（要素の完全なリストアップ）

**ユーザー確認が必要なこと**:
- [ ] この修正計画で方向性は正しいか？
- [ ] 他にサンプルとなるConfluence HTMLページはあるか？
- [ ] 優先的に対応すべきマクロや要素はあるか？

---

## 付録: 参考資料

### Confluence HTML Class名の推定パターン

- `confluence-content`: コンテンツコンテナ
- `confluence-embedded-file-wrapper`: 画像ラッパー
- `confluence-embedded-image`: 画像要素
- `expand-container`, `expand-control`, `expand-content`: Expandマクロ
- `confluence-information-macro`: Info/Warning/Note/Tipマクロ
- `plugin_pagetree`: Page Treeマクロ
- `aui-icon`: Atlassian UI アイコン
- `conf-macro-render`: マクロレンダリング要素

これらは実際のHTMLを分析してさらに追加・更新する必要があります。
