import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { addCategoryPage } from "./add-category";
import { mainMenuPage } from "../main-menu";
import { viewApisPage } from "./view-apis";
import { viewApisDetailPage } from "./view-apis-detail";
import { editApiKeyPage } from "./edit-api-detail";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { ReadlineService } from "../../services/readline.service";

export async function adminUserMenuPage(): Promise<void> {
  console.log("\n🛠️ Admin Menu");
  console.log("1️⃣  View External APIs (no API key)");
  console.log("2️⃣  View API Details");
  console.log("3️⃣  Edit API Key");
  console.log("4️⃣  Add Category");
  console.log("0️⃣  Back");

  const choice = await ReadlineService.ask("Choose: ");

  switch (choice) {
    case "1":
      return renderPage(viewApisPage, PagesName.VIEW_APIS);
    case "2":
      return renderPage(viewApisDetailPage, PagesName.VIEW_APIS_DETAIL);
    case "3":
      return renderPage(editApiKeyPage, PagesName.EDIT_APIS_DETAIL);
    case "4":
      return renderPage(addCategoryPage, PagesName.ADD_CATEGORY);
    case "0":
      return renderPage(mainMenuPage, PagesName.MAIN_MENU);
    default:
      console.log("❌ Invalid choice");
      return renderPage(adminUserMenuPage, PagesName.ADMIN_MENU);
  }
}
