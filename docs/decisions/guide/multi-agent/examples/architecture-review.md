# アーキテクチャレビュー例

テーマ: confluence-content のキャッシュ導入  
ゴール: TTL と責務分離の方針を決める  
参加ロール: facilitator, architect, ops-cost, risk-security  
ターン上限: 5

## Step 1: ゴール/終了条件の宣言
facilitator:
- 目的: TTL と責務分離を決める
- 終了条件: 決定/保留/宿題が揃う
- ターン上限: 5

## Step 2: 参加ロールと出力ルールの共有
facilitator:
- roles: architect, ops-cost, risk-security
- ルール: 箇条書き3点以内、根拠を添える、推測は明示

## Step 3: 初回シリアル収集
architect:
- 取得層とクリーニング層の分離で責務を明確化
- キャッシュはページID単位が自然
- 推測: TTL は 5-15 分が妥当

ops-cost:
- Redis でキャッシュし、ヒット率を監視
- TTL は短すぎるとコスト増
- 推測: 10 分なら運用負荷は低い

risk-security:
- キャッシュに機密を含む可能性がある
- 失敗時のエラーハンドリングを統一
- 推測: 削除要求の伝播が必要

facilitator summary:
- 決定: 取得層/クリーニング層は分離方向
- 保留: TTL 値の確定
- 宿題: 機密データの扱いと削除伝播
- 次ターン: TTL 候補と安全策を絞る

## Step 4: 論点絞り込み
facilitator:
- TTL 候補を 5/10/15 分に絞る
- 機密データのキャッシュ方針を確認

## Step 5: 並列→要約統合
architect:
- TTL 10 分を推奨（再取得コストと整合性の中間）
- 取得層は生HTMLを保持、クリーニング層は都度生成

ops-cost:
- TTL 10 分ならヒット率改善が見込める
- Redis メモリ上限を設ける

facilitator summary:
- 決定: TTL は 10 分を仮採用
- 保留: キャッシュ上限値の決定
- 宿題: 削除要求の伝播設計

## Step 6: リスクチェック
risk-security:
- 機密更新の反映遅延がリスク
- 対応: 重要ページは手動パージを用意
- 推測: 監査ログにパージ履歴が必要

ops-cost:
- パージ運用が増えると負担
- 重要ページ一覧の運用ルールが必要

## Step 7: クロージング
facilitator final summary:
- 決定: 取得層/クリーニング層を分離、TTL 10 分を仮採用
- 保留: Redis 上限値と重要ページ運用
- 宿題: パージ運用と監査ログ設計
- 次アクション: PoC でヒット率と更新遅延を計測
