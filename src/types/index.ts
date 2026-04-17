import { MENU_OPTIONS_LEVEL_1 } from "@src/constants";

import {
  REACT_MENU_LAYOUT,
  REACT_MENU_ROUTER,
  REACT_MENU_STATE_MANAGEMENT,
  REACT_MENU_QUERY,
  REACT_MENU_CSS,
  REACT_MENU_LINTER,
} from "@src/options/react-vite/constants";

export type REACT_MENU_LAYOUT_VALUE = (typeof REACT_MENU_LAYOUT)[keyof typeof REACT_MENU_LAYOUT]["value"];
export type REACT_MENU_ROUTER_VALUE = (typeof REACT_MENU_ROUTER)[keyof typeof REACT_MENU_ROUTER]["value"];
export type REACT_MENU_STATE_MANAGEMENT_VALUE = (typeof REACT_MENU_STATE_MANAGEMENT)[keyof typeof REACT_MENU_STATE_MANAGEMENT]["value"];
export type REACT_MENU_QUERY_VALUE = (typeof REACT_MENU_QUERY)[keyof typeof REACT_MENU_QUERY]["value"];
export type REACT_MENU_CSS_VALUE = (typeof REACT_MENU_CSS)[keyof typeof REACT_MENU_CSS]["value"];
export type REACT_MENU_LINTER_VALUE = (typeof REACT_MENU_LINTER)[keyof typeof REACT_MENU_LINTER]["value"];

type EnabledKeys = {
  [K in keyof typeof MENU_OPTIONS_LEVEL_1]: (typeof MENU_OPTIONS_LEVEL_1)[K]["disabled"] extends false
    ? K
    : never;
}[keyof typeof MENU_OPTIONS_LEVEL_1];
export type ProjectType = (typeof MENU_OPTIONS_LEVEL_1)[EnabledKeys]["value"];

export type Cart = ReactViteCore | NextJSCore | null;
export interface ReactViteCore {
  type: typeof MENU_OPTIONS_LEVEL_1.ReactVite.value;
  projectName: string;
  layout: REACT_MENU_LAYOUT_VALUE;
  router: REACT_MENU_ROUTER_VALUE;
  stateManagement: REACT_MENU_STATE_MANAGEMENT_VALUE;
  query: REACT_MENU_QUERY_VALUE;
  css: REACT_MENU_CSS_VALUE;
  linter: REACT_MENU_LINTER_VALUE;
}
export interface NextJSCore {
  type: typeof MENU_OPTIONS_LEVEL_1.NextJS.value;
  layout: REACT_MENU_LAYOUT_VALUE;
  version: string;
}
