import axios from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { adminUserMenuPage } from "./admin-user-menu";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { AppStateService } from "../../services/app-state.service";
import { mainMenuPage } from "../main-menu";
import { ReadlineService } from "../../services/readline.service";

export async function addCategoryPage(): Promise<void> {
  const appState: AppStateService = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) {
    console.log("\nUser Not Authorized!");
    return renderPage(mainMenuPage, PagesName.MAIN_MENU);
  }
  const name = await ReadlineService.ask("Enter new category name: ");

  try {
    await axios.post(`http://localhost:3000/admin/category/add/${name}`, null, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    console.log("✅ Category added");
  } catch (err) {
    console.log("❌ Failed to add category");
    console.log(err);
  }

  await ReadlineService.ask("\nPress Enter to return...");
  return renderPage(adminUserMenuPage, PagesName.ADMIN_MENU);
}
