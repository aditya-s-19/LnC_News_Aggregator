import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "./normal-user-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { ReadlineService } from "../../services/readline.service";

export async function reportArticlePage(): Promise<void> {
  const user = AppStateService.getInstance().getUser();
  if (!user) return normalUserMenuPage();

  console.clear();
  console.log("🚩 Report an Article");
  const articleId = await ReadlineService.ask("Enter the Article ID to report: ");

  try {
    await axios.post(
      `http://localhost:3000/article/${articleId}/report`,
      {},
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );
    console.log("\n✅ Report submitted successfully.");
  } catch (err) {
    handleAxiosError(err);
  }

  await ReadlineService.ask("\nPress Enter to return...");
  return normalUserMenuPage();
}
