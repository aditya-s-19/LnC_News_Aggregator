import axios from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { adminUserMenuPage } from "./admin-user-menu";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { AppStateService } from "../../services/app-state.service";
import { mainMenuPage } from "../main-menu";
import { ReadlineService } from "../../services/readline.service";

export async function editApiKeyPage(): Promise<void> {
  const appState: AppStateService = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) {
    console.log("\nUser Not Authorized!");
    return renderPage(mainMenuPage, PagesName.MAIN_MENU);
  }

  const id = await ReadlineService.ask("Enter API ID to update: ");
  const apiKey = await ReadlineService.ask("Enter new API key: ");

  try {
    await axios.put(
      `http://localhost:3000/admin/source/${id}`,
      { api_key: apiKey },
      {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }
    );
    console.log("✅ API key updated");
  } catch {
    console.log("❌ Failed to update API key");
  }

  const rl2 = readline.createInterface({ input, output });
  await rl2.question("\nPress Enter to return...");
  rl2.close();
  return renderPage(adminUserMenuPage, PagesName.ADMIN_MENU);
}
