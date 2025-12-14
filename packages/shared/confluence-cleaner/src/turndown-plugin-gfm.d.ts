/**
 * Type definitions for turndown-plugin-gfm
 */

declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";

  export interface GfmOptions {
    strikethrough?: boolean;
    tables?: boolean;
    taskListItems?: boolean;
  }

  export const gfm: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}
