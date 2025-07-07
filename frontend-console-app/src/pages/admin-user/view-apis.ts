import axios from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { adminUserMenuPage } from "./admin-user-menu";
import { apiSource } from "../../utils/types/apiSource.type";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { AppStateService } from "../../services/app-state.service";
import { mainMenuPage } from "../main-menu";
import { ReadlineService } from "../../services/readline.service";

export async function viewApisPage(): Promise<void> {
  const appState: AppStateService = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) {
    console.log("\nUser Not Authorized!");
    return renderPage(mainMenuPage, PagesName.MAIN_MENU);
  }
  try {
    const res = await axios.get("http://localhost:3000/admin/sources", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    console.log("\n📡 External APIs:");
    res.data.forEach((api: apiSource) => {
      console.log(`${api.name}`);
      console.log(`- id: ${api.id}`);
      console.log(`- status: ${api.status}`);
      console.log(`- last_accessed: ${api.last_accessed} \n\n`);
    });
  } catch {
    console.log("❌ Failed to fetch API list");
  }

  await ReadlineService.ask("\nPress Enter to return...");
  return renderPage(adminUserMenuPage, PagesName.ADMIN_MENU);
}
