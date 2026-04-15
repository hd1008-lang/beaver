import { sleep } from "@src/utils";
import { ChalkInstance } from "chalk";

export const typeWriter = async (text: string, colorFunc: ChalkInstance, speed = 50) => {
  for (const char of text) {
    process.stdout.write(colorFunc(char));
    await sleep(speed);
  }
  process.stdout.write('\n'); // Move to next line when done
}