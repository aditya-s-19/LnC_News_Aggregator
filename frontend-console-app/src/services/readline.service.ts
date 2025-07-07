import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

class ReadlineService {
  private static rl = readline.createInterface({ input, output });

  static async ask(question: string): Promise<string> {
    return await this.rl.question(question);
  }

  static close(): void {
    this.rl.close();
  }
}

export { ReadlineService };
