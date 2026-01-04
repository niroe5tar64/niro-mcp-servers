# API 標準

[目的: 命名、構造、認証、バージョニング、エラーに関する一貫した API パターン]

## フィロソフィー
- 予測可能でリソース指向の設計を優先
- 契約を明示し、破壊的変更を最小化
- セキュアデフォルト（認証優先、最小権限）

## エンドポイントパターン
```
/{version}/{resource}[/{id}][/{sub-resource}]
```
例:
- `/api/v1/users`
- `/api/v1/users/:id`
- `/api/v1/users/:id/posts`

HTTP 動詞:
- GET（読み取り、安全、冪等）
- POST（作成）
- PUT/PATCH（更新）
- DELETE（削除、冪等）

## リクエスト/レスポンス

リクエスト（典型例）:
```json
{ "data": { ... }, "metadata": { "requestId": "..." } }
```

成功:
```json
{ "data": { ... }, "meta": { "timestamp": "...", "version": "..." } }
```

エラー:
```json
{ "error": { "code": "ERROR_CODE", "message": "...", "field": "optional" } }
```
（詳細は error-handling を参照。）

## ステータスコード（パターン）
- 2xx: 成功（200 read, 201 create, 204 delete）
- 4xx: クライアント起因（400 validation, 401/403 auth, 404 missing）
- 5xx: サーバ起因（500 generic, 503 unavailable）
結果に最も適したステータスを選ぶ。

## 認証
- 認証情報は標準の場所に置く
```
Authorization: Bearer {token}
```
- ビジネスロジック前に未認証を拒否

## バージョニング
- URL / ヘッダ / メディアタイプでバージョン管理
- 破壊的変更 → 新バージョン
- 非破壊 → 同一バージョン
- 廃止猶予期間と周知を設ける

## ページネーション/フィルタ（該当時）
- ページネーション: `page`, `pageSize` もしくはカーソル
- フィルタ: 明示的なクエリパラメータ
- ソート: `sort=field:asc|desc`
`meta` にページ情報を返す。

---
_パターンと判断に集中し、エンドポイント一覧は載せない。_
