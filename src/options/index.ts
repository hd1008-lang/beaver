import { select, Separator } from "@inquirer/prompts";
import { MENU_OPTIONS_LEVEL_1 } from "@src/constants";
import { Cart, ProjectType } from "@src/types";
import chalk from "chalk";


export const menu = async () => {
    const keys = Object.keys(MENU_OPTIONS_LEVEL_1) as Array<keyof typeof MENU_OPTIONS_LEVEL_1>;
    const enabledKeys = keys.filter((key) => !MENU_OPTIONS_LEVEL_1[key].disabled);
    const choices = [
        ...enabledKeys.map((key) => ({
            name: MENU_OPTIONS_LEVEL_1[key].display,
            value: MENU_OPTIONS_LEVEL_1[key].value,
            description: MENU_OPTIONS_LEVEL_1[key].description,
        })),
        new Separator(),
        {
            name: MENU_OPTIONS_LEVEL_1.Nuxt.display,
            value: MENU_OPTIONS_LEVEL_1.Nuxt.value,
            disabled: MENU_OPTIONS_LEVEL_1.Nuxt.description as string,
        },
    ];

    const answer = await select({
        message: chalk.whiteBright("How can I help you 👨‍🍳"),
        choices,
    });

    const cart = { type: answer as ProjectType } as Cart;
    if(answer === MENU_OPTIONS_LEVEL_1.ReactVite.value) {
        const { flowReactVite } = await import("@src/options/react-vite");
        await flowReactVite(cart);
    } else if (answer === MENU_OPTIONS_LEVEL_1.ChromeExtension.value) {
        const { flowChromeExtension } = await import("@src/options/chrome-extension");
        await flowChromeExtension(cart);
    }
    return cart
};
