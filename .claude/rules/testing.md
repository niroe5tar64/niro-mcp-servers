# テスト規約

## テストフレームワーク

Bunの組み込みテストランナーを使用する。

## ファイル命名

- テストファイル：`*.test.ts`
- テストは対象ファイルと同階層に配置

## テスト実行

```bash
# 全テスト
bun test

# 単一ファイル
bun test path/to/file.test.ts

# パッケージ内
cd packages/<package-name>
bun test
```

## テスト記述スタイル

```typescript
import { describe, test, expect } from "bun:test";

describe("機能名", () => {
  test("期待される動作", () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

## モック

- 外部APIはモックする
- `bun:test`の`mock`機能を使用
