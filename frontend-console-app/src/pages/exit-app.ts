import { ReadlineService } from "../services/readline.service";

export async function exitAppPage(): Promise<void> {
  console.log("👋 Goodbye!");
  ReadlineService.close();
  process.exit(0);
}
