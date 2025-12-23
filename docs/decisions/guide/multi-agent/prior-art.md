# Multi-Agent 議論の先行事例と研究

複数AI Agent会議のアプローチは既に学術研究と商用実装の両面で進行している。

## 学術研究

### Multi-Agent Debate (MAD)（Du et al., 2023）

複数のLLMエージェントが討論を通じて回答を改善する手法。ICMLで発表。

- 各エージェントが独立して初期回答を生成
- 複数ラウンドで他エージェントの回答をレビュー・フィードバック
- ペルソナを設定して批判的思考を促進

**実績：**
- 数学的推論（GSM-8K）で異なるモデル群の討論が91%精度達成、GPT-4を超える結果
- 事実性の向上（幻覚削減）

参考：
- [Du et al. - Improving Factuality and Reasoning through Multiagent Debate](https://arxiv.org/abs/2305.14325)
- [Should we be going MAD? - arXiv](https://arxiv.org/html/2311.17371v2)

### Society of Mind（Minsky理論の現代的応用）

1980年代のMarvin Minsky理論「心は多くの協働するエージェントの集合」をLLMに応用。

- 複数エージェントの内部議論で幻覚削減
- 認知バイアスと過信の軽減
- AIシステムの内部安全機構としても機能

参考：
- [Revisiting Minsky's Society of Mind in 2025](https://suthakamal.substack.com/p/revisiting-minskys-society-of-mind)
- [Language Model Agents in 2025: Society Mind Revisited](https://isolutions.medium.com/language-model-agents-in-2025-897ec15c9c42)

### CAMEL：ロールプレイによる自律協調フレームワーク（2023）

複数AIエージェントがロールプレイで自律的に協調するフレームワーク。

- AI User Agent（指示者）、AI Assistant Agent（実行者）、Task-Specifier Agent（戦略家）の3層構成
- 100万エージェントまでスケール可能
- 大規模タスク指向データセット（AI Society、Code等）を生成

参考：[CAMEL-AI](https://github.com/camel-ai/camel)

## オープンソースフレームワーク

| フレームワーク | 開発元 | 特徴 | 最適な用途 |
|---------------|--------|------|-----------|
| **AutoGen** | Microsoft | 会話ベース、human-in-the-loop | 複雑な長期ワークフロー |
| **CrewAI** | OSS | ロール・タスク定義が簡単 | プロトタイプ開発 |
| **MetaGPT** | OSS | 開発チームをシミュレート | ソフトウェア開発 |
| **LangGraph** | LangChain | グラフベース、状態管理に強い | 条件分岐・並列実行 |
| **CAMEL** | OSS | ロールプレイ型自律協調 | 創造的タスク |

参考：
- [CrewAI vs AutoGen 比較](https://sider.ai/blog/ai-tools/crewai-vs-autogen-which-multi-agent-framework-wins-in-2025)
- [LangGraph Multi-Agent Workflows](https://blog.langchain.com/langgraph-multi-agent-workflows/)
- [Multi-Agent Collaboration Mechanisms: A Survey](https://arxiv.org/html/2501.06322v1)

## 商用実装事例

### 博報堂テクノロジーズ「マルチエージェント ブレストAI」（2024年3月〜）

複数の生成AI同士が議論して、意思決定やアイデア創出をするサービス。

**構成：** 司会者、営業、商品企画、ストラテジックプランナーの4役

**運用フロー：**
1. ユーザーが会議ゴール・テーマを入力
2. 参加AIメンバーを選択
3. アイデア軸・評価軸を設定
4. 司会AIの進行で議論開始（約10分）
5. PowerPoint形式で出力

参考：[日経XTECH](https://xtech.nikkei.com/atcl/nxt/column/18/00001/09117/)

### NTT「AIエージェント自律協調技術」（2025年8月発表）

対話を通じて複数エージェントが相互調整しながらタスクを解決する基盤技術。

- サブタスクごとにエージェントを生成
- 「チーム会議」「生産会議」で相互調整

参考：[NTTニュースリリース](https://group.ntt/jp/newsrelease/2025/08/08/250808b.html)

### 富士通「会議エージェント」

人間の会議に参加し、コンテキストを理解して情報提供・施策提案を行う。

参考：[富士通](https://documents.research.global.fujitsu.com/ai-agent-for-communication-support)

### 博報堂テクノロジーズ「Nomatica」

複数の専門AIエージェントが連携し、自律的に議論・提案を行うマルチエージェント型ツール。

参考：[Nomatica](https://www.nomatica.hakuhodo-technologies.co.jp/)

## 研究から得られた知見

**スケーラビリティの課題：**

> 75%以上のマルチエージェントシステムは、5エージェントを超えると管理が困難になる

**先行事例から学べる運用の工夫：**

1. **役割を明確に固定** - 司会、専門家A、専門家Bなど
2. **時間を区切る** - 10分程度で完結
3. **出力形式を定義** - PowerPoint等の成果物フォーマットを予め決定
4. **人間は設定と最終判断に集中** - 議論自体はAI間で回す

参考：[Multi-Agent LLM Applications Review](https://newsletter.victordibia.com/p/multi-agent-llm-applications-a-review)
