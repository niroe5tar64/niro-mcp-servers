import type { DevContainerConfig } from "./shared/src/types";

export const projectConfig: DevContainerConfig = {
  name: "Niro MCP Servers Dev Environment",

  // プロジェクト固有のポートフォワード
  forwardPorts: [50301],

  // プロジェクト固有の拡張機能
  // 注: base.tsに既に以下が含まれている
  // - oven.bun-vscode
  // - biomejs.biome
  // - mhutchie.git-graph
  // - bierner.markdown-mermaid
  // - anthropic.claude-code
  // - GitHub.copilot
  customizations: {
    vscode: {
      extensions: [
        // プロジェクト固有の拡張機能があればここに追加
      ],
      settings: {
        // Biomeの設定はbase.tsで既に設定済み
        // プロジェクト固有の設定があればここに追加
      },
    },
  },

  // プロジェクト固有の環境変数
  // 注: CLAUDE_SETTINGS_PATH はbase.tsで既に設定済み
  containerEnv: {
    // プロジェクト固有の環境変数があればここに追加
  },

  // initializeCommand（.envテンプレートのコピー）
  initializeCommand:
    "bash .devcontainer/initialize.sh && (test -f packages/confluence-content/.env || cp packages/confluence-content/.env.template packages/confluence-content/.env)",

  // postCreateCommand（bun installを追加）
  // 注: post-create.shが既に実行されているため、その後にbun installを実行
  postCreateCommand: "bash .devcontainer/post-create.sh && bun install",

  // Claude データ永続化（volumeマウント）
  // 注: base.tsで既に .claude, .codex はbindマウント設定済み
  // ここでvolumeマウントを追加すると上書きされる可能性があるため、
  // base.tsの設定をそのまま使用する場合はコメントアウト
  // mounts: [
  //   'source=niro-mcp-claude-data,target=/home/dev-user/.claude,type=volume',
  // ],
};

export default projectConfig;
