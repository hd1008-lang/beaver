import { REACT_MENU_LAYOUT, REACT_MENU_ROUTER, REACT_MENU_STATE_MANAGEMENT } from "@src/options/react-vite/constants";

export type MenuConfig = {
  display: string;
  value: string;
  description: string;
  disabled: boolean;
};

export type MenuOptions = Record<string, MenuConfig>;

export type REACT_MENU_LAYOUT_KEYS = keyof typeof REACT_MENU_LAYOUT;
export type REACT_MENU_ROUTER_KEYS = keyof typeof REACT_MENU_ROUTER;
export type REACT_MENU_STATE_MANAGEMENT_KEYS = keyof typeof REACT_MENU_STATE_MANAGEMENT;