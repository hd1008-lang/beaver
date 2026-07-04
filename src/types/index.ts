import { MENU_OPTIONS_LEVEL_1 } from "@src/constants";
import { HARNESS_MENU_AI, HARNESS_MENU_PROJECT_TYPE } from "@src/options/harness-only/constants";

import {
  REACT_MENU_LAYOUT,
  REACT_MENU_ROUTER,
  REACT_MENU_STATE_MANAGEMENT,
  REACT_MENU_QUERY,
  REACT_MENU_CSS,
  REACT_MENU_LINTER,
  REACT_MENU_AI,
  REACT_MENU_TESTING,
} from "@src/options/react-vite/constants";

import {
  CHROME_MENU_STATE_MANAGEMENT,
  CHROME_MENU_QUERY,
  CHROME_MENU_CSS,
  CHROME_MENU_LINTER,
  CHROME_MENU_AI,
} from "@src/options/chrome-extension/constants";

export type REACT_MENU_LAYOUT_VALUE = (typeof REACT_MENU_LAYOUT)[keyof typeof REACT_MENU_LAYOUT]["value"];
export type REACT_MENU_ROUTER_VALUE = (typeof REACT_MENU_ROUTER)[keyof typeof REACT_MENU_ROUTER]["value"];
export type REACT_MENU_STATE_MANAGEMENT_VALUE = (typeof REACT_MENU_STATE_MANAGEMENT)[keyof typeof REACT_MENU_STATE_MANAGEMENT]["value"];
export type REACT_MENU_QUERY_VALUE = (typeof REACT_MENU_QUERY)[keyof typeof REACT_MENU_QUERY]["value"];
export type REACT_MENU_CSS_VALUE = (typeof REACT_MENU_CSS)[keyof typeof REACT_MENU_CSS]["value"];
export type REACT_MENU_LINTER_VALUE = (typeof REACT_MENU_LINTER)[keyof typeof REACT_MENU_LINTER]["value"];
export type REACT_MENU_AI_VALUE = (typeof REACT_MENU_AI)[keyof typeof REACT_MENU_AI]["value"];
export type REACT_MENU_TESTING_VALUE = (typeof REACT_MENU_TESTING)[keyof typeof REACT_MENU_TESTING]["value"];

export type CHROME_MENU_STATE_MANAGEMENT_VALUE = (typeof CHROME_MENU_STATE_MANAGEMENT)[keyof typeof CHROME_MENU_STATE_MANAGEMENT]["value"];
export type CHROME_MENU_QUERY_VALUE = (typeof CHROME_MENU_QUERY)[keyof typeof CHROME_MENU_QUERY]["value"];
export type CHROME_MENU_CSS_VALUE = (typeof CHROME_MENU_CSS)[keyof typeof CHROME_MENU_CSS]["value"];
export type CHROME_MENU_LINTER_VALUE = (typeof CHROME_MENU_LINTER)[keyof typeof CHROME_MENU_LINTER]["value"];
export type CHROME_MENU_AI_VALUE = (typeof CHROME_MENU_AI)[keyof typeof CHROME_MENU_AI]["value"];

type EnabledKeys = {
  [K in keyof typeof MENU_OPTIONS_LEVEL_1]: (typeof MENU_OPTIONS_LEVEL_1)[K]["disabled"] extends false
    ? K
    : never;
}[keyof typeof MENU_OPTIONS_LEVEL_1];
export type ProjectType = (typeof MENU_OPTIONS_LEVEL_1)[EnabledKeys]["value"];

export type HARNESS_PROJECT_TYPE_VALUE = (typeof HARNESS_MENU_PROJECT_TYPE)[keyof typeof HARNESS_MENU_PROJECT_TYPE]["value"];
export type HARNESS_MENU_AI_VALUE = (typeof HARNESS_MENU_AI)[keyof typeof HARNESS_MENU_AI]["value"];

export interface HarnessOnlyCore {
  type: typeof MENU_OPTIONS_LEVEL_1.HarnessOnly.value;
  targetDirectory: string;
  projectName: string;
  projectType: HARNESS_PROJECT_TYPE_VALUE;
  ai: HARNESS_MENU_AI_VALUE;
  productDescription: string;
}

export type Cart = ReactViteCore | NextJSCore | ChromeExtensionCore | HarnessOnlyCore | null;
export interface ReactViteCore {
  type: typeof MENU_OPTIONS_LEVEL_1.ReactVite.value;
  projectName: string;
  layout: REACT_MENU_LAYOUT_VALUE;
  router: REACT_MENU_ROUTER_VALUE;
  stateManagement: REACT_MENU_STATE_MANAGEMENT_VALUE;
  query: REACT_MENU_QUERY_VALUE;
  css: REACT_MENU_CSS_VALUE;
  linter: REACT_MENU_LINTER_VALUE;
  testing: REACT_MENU_TESTING_VALUE;
  ai: REACT_MENU_AI_VALUE;
  productDescription: string;
}
export interface NextJSCore {
  type: typeof MENU_OPTIONS_LEVEL_1.NextJS.value;
  layout: REACT_MENU_LAYOUT_VALUE;
  version: string;
}
export interface ChromeExtensionCore {
  type: typeof MENU_OPTIONS_LEVEL_1.ChromeExtension.value;
  projectName: string;
  stateManagement: CHROME_MENU_STATE_MANAGEMENT_VALUE;
  query: CHROME_MENU_QUERY_VALUE;
  css: CHROME_MENU_CSS_VALUE;
  linter: CHROME_MENU_LINTER_VALUE;
  ai: CHROME_MENU_AI_VALUE;
  productDescription: string;
}
