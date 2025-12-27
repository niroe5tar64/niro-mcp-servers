/**
 * Confluence API Client
 *
 * Confluence REST API へのアクセスを提供するクライアントクラス。
 * 認証、エラーハンドリング、タイムアウト設定を含みます。
 */

export interface ConfluencePageView {
  id: string;
  title: string;
  space?: {
    key: string;
    name: string;
  };
  body: {
    view: {
      value: string; // レンダリング済みHTML
      representation: string;
    };
  };
  _links: {
    webui: string;
    self: string;
  };
}

export interface ConfluencePageViewResponse {
  pageInfo: {
    id: string;
    title: string;
    spaceKey: string;
    spaceName: string;
    _links: {
      webui: string;
      self: string;
    };
  };
  html: string;
}

/**
 * CQL検索関連の型定義
 */

export interface Breadcrumb {
  id: string;
  title: string;
  type: string;
}

export interface Ancestor {
  id: string;
  title: string;
  type: string;
}

export interface ContentSpace {
  key: string;
  name: string;
}

export interface Content {
  id: string;
  type: string;
  title: string;
  space?: ContentSpace;
  ancestors?: Ancestor[];
}

export interface SearchResult {
  content: Content;
  title: string;
  excerpt?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface SearchPageResponse {
  results: SearchResult[];
  _links?: {
    next?: string;
  };
}

export class ConfluenceApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "ConfluenceApiError";
  }
}

/**
 * Confluence API クライアント
 */
export class ConfluenceApiClient {
  private baseUrl: string;
  private username: string;
  private password?: string;
  private apiToken?: string;
  private timeout: number;

  constructor(options: {
    baseUrl: string;
    username: string;
    password?: string;
    apiToken?: string;
    timeout?: number;
  }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ""); // 末尾のスラッシュを削除
    this.username = options.username;
    this.password = options.password;
    this.apiToken = options.apiToken;
    this.timeout = options.timeout ?? 30000; // デフォルト30秒

    if (!this.password && !this.apiToken) {
      throw new Error(
        "Either CONFLUENCE_PASSWORD or CONFLUENCE_API_TOKEN must be provided",
      );
    }
  }

  /**
   * 認証ヘッダーを生成
   */
  private getAuthHeader(): string {
    if (this.apiToken) {
      // APIトークンの場合: Bearer認証を使用
      return `Bearer ${this.apiToken}`;
    }
    if (this.password) {
      // パスワードの場合: Basic認証で username:password を使用
      const credentials = `${this.username}:${this.password}`;
      return `Basic ${Buffer.from(credentials).toString("base64")}`;
    }
    throw new Error("No authentication method available");
  }

  /**
   * HTTPリクエストを実行（タイムアウト付き）
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ConfluenceApiError(
          `Request timeout after ${this.timeout}ms`,
          408,
        );
      }
      throw error;
    }
  }

  /**
   * レスポンスボディをタイムアウト付きで読み取る
   */
  private async readResponseWithTimeout<T>(
    response: Response,
    parser: (text: string) => T,
  ): Promise<T> {
    // タイムアウト用のPromise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new ConfluenceApiError(
            `Response body read timeout after ${this.timeout}ms`,
            408,
          ),
        );
      }, this.timeout);
    });

    // レスポンスボディの読み取りとタイムアウトを競争させる
    try {
      const text = await Promise.race([response.text(), timeoutPromise]);
      return parser(text);
    } catch (error) {
      if (error instanceof ConfluenceApiError) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * ページのHTMLビュー形式を取得
   *
   * @param pageId - ページID
   * @returns ページ情報とレンダリング済みHTML
   * @throws ConfluenceApiError - APIエラーが発生した場合
   */
  async getPageView(pageId: string): Promise<ConfluencePageViewResponse> {
    const url = `${this.baseUrl}/rest/api/content/${pageId}?expand=body.view,space`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorResponse: unknown;

        try {
          const errorBody = await this.readResponseWithTimeout(
            response,
            (text) => JSON.parse(text),
          );
          errorResponse = errorBody;
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "message" in errorBody
          ) {
            errorMessage = String(errorBody.message);
          }
        } catch {
          // JSONパースに失敗した場合はデフォルトメッセージを使用
        }

        throw new ConfluenceApiError(
          errorMessage,
          response.status,
          errorResponse,
        );
      }

      const data = (await this.readResponseWithTimeout(
        response,
        (text) => JSON.parse(text) as ConfluencePageView,
      )) as ConfluencePageView;

      // レスポンス形式を変換
      return {
        pageInfo: {
          id: data.id,
          title: data.title,
          spaceKey: data.space?.key || "",
          spaceName: data.space?.name || "",
          _links: data._links,
        },
        html: data.body.view.value,
      };
    } catch (error) {
      if (error instanceof ConfluenceApiError) {
        throw error;
      }

      // ネットワークエラーなどの場合
      if (error instanceof Error) {
        throw new ConfluenceApiError(
          `Network error: ${error.message}`,
          undefined,
          error,
        );
      }

      throw new ConfluenceApiError("Unknown error occurred", undefined, error);
    }
  }

  /**
   * CQLクエリでコンテンツを検索
   *
   * @param cql - Confluence Query Language クエリ
   * @param expand - 展開するフィールド（例: "ancestors,space"）
   * @param cursor - ページネーション用カーソル
   * @returns 検索結果
   * @throws ConfluenceApiError - APIエラーが発生した場合
   */
  async searchContentByCql(
    cql: string,
    expand?: string,
    cursor?: string,
  ): Promise<SearchPageResponse> {
    const params = new URLSearchParams({ cql });
    if (expand) {
      params.append("expand", expand);
    }
    if (cursor) {
      params.append("cursor", cursor);
    }
    params.append("limit", "100"); // 1回のリクエストで多めに取得

    const url = `${this.baseUrl}/rest/api/content/search?${params.toString()}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorResponse: unknown;

        try {
          const errorBody = await this.readResponseWithTimeout(
            response,
            (text) => JSON.parse(text),
          );
          errorResponse = errorBody;
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "message" in errorBody
          ) {
            errorMessage = String(errorBody.message);
          }
        } catch {
          // JSONパースに失敗した場合はデフォルトメッセージを使用
        }

        throw new ConfluenceApiError(
          errorMessage,
          response.status,
          errorResponse,
        );
      }

      const data = (await this.readResponseWithTimeout(
        response,
        (text) => JSON.parse(text) as SearchPageResponse,
      )) as SearchPageResponse;

      return data;
    } catch (error) {
      if (error instanceof ConfluenceApiError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ConfluenceApiError(
          `Network error: ${error.message}`,
          undefined,
          error,
        );
      }

      throw new ConfluenceApiError("Unknown error occurred", undefined, error);
    }
  }

  /**
   * CQLクエリで全コンテンツを検索（ページネーション対応）
   *
   * @param cql - Confluence Query Language クエリ
   * @param expand - 展開するフィールド（例: "ancestors,space"）
   * @returns すべての検索結果
   * @throws ConfluenceApiError - APIエラーが発生した場合
   */
  async searchAllContentByCql(
    cql: string,
    expand?: string,
  ): Promise<SearchResult[]> {
    let allResults: SearchResult[] = [];
    let cursor: string | undefined;
    let loopCount = 0;
    const maxLoops = 1000; // 無限ループ防止

    do {
      if (loopCount >= maxLoops) {
        throw new ConfluenceApiError(
          `Pagination loop limit reached (${maxLoops})`,
          undefined,
        );
      }

      const response = await this.searchContentByCql(cql, expand, cursor);
      allResults = [...allResults, ...response.results];

      // 次のページのカーソルを取得
      const nextUrl = response._links?.next;
      if (nextUrl) {
        // URLからcursorパラメータを抽出
        const url = new URL(nextUrl, this.baseUrl);
        cursor = url.searchParams.get("cursor") || undefined;
      } else {
        cursor = undefined;
      }

      loopCount++;
    } while (cursor);

    return allResults;
  }

  /**
   * 環境変数からクライアントインスタンスを作成
   */
  static fromEnvironment(): ConfluenceApiClient {
    const baseUrl = process.env.CONFLUENCE_BASE_URL;
    const username = process.env.CONFLUENCE_USERNAME;
    const password = process.env.CONFLUENCE_PASSWORD;
    const apiToken = process.env.CONFLUENCE_API_TOKEN;
    const timeout = process.env.CONFLUENCE_TIMEOUT
      ? Number.parseInt(process.env.CONFLUENCE_TIMEOUT, 10)
      : undefined;

    if (!baseUrl) {
      throw new Error("CONFLUENCE_BASE_URL environment variable is required");
    }
    if (!username) {
      throw new Error("CONFLUENCE_USERNAME environment variable is required");
    }

    return new ConfluenceApiClient({
      baseUrl,
      username,
      password,
      apiToken,
      timeout,
    });
  }
}
