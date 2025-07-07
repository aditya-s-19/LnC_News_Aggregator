import {
  viewReports,
  hideArticle,
  unhideArticle,
  hideCategory,
  unhideCategory,
  addHiddenKeyword,
  removeHiddenKeyword,
  getModerationStatus,
} from "./admin-moderation-actions";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "../normal-user/normal-user-menu";
import { renderPage } from "../../utils/helper/runPage";
import { adminUserMenuPage } from "./admin-user-menu";
import { PagesName } from "../../utils/constants/pages.enum";
import { ReadlineService } from "../../services/readline.service";

export async function adminModerationMenuPage(): Promise<void> {
  const user = AppStateService.getInstance().getUser();
  if (!user || user.role !== "admin") return normalUserMenuPage();

  while (true) {
    const status = await getModerationStatus();

    console.log(`🛠️  Admin Moderation Menu`);

    console.log(`\n📂 Categories:`);
    status.categories.forEach((c: any) => console.log(`- ${c.id}. ${c.name} ${c.isHidden ? "(Hidden)" : ""}`));

    console.log(`\n🚫 Hidden Keywords:`);
    status.hiddenKeywords.forEach((k: any) => console.log(`- ID ${k.id}: "${k.keyword}"`));

    console.log(`\nOptions:`);
    console.log(`1. View Reported Articles`);
    console.log(`2. Hide Article`);
    console.log(`3. Unhide Article`);
    console.log(`4. Hide Category`);
    console.log(`5. Unhide Category`);
    console.log(`6. Add Hidden Keyword`);
    console.log(`7. Remove Hidden Keyword`);
    console.log(`0. 🔙 Back`);

    const choice = await ReadlineService.ask("Choose an option: ");
    switch (choice.trim()) {
      case "1":
        await viewReports();
        break;
      case "2":
        await hideArticle();
        break;
      case "3":
        await unhideArticle();
        break;
      case "4":
        await hideCategory();
        break;
      case "5":
        await unhideCategory();
        break;
      case "6":
        await addHiddenKeyword();
        break;
      case "7":
        await removeHiddenKeyword();
        break;
      case "0":
        return renderPage(adminUserMenuPage, PagesName.ADMIN_MENU);
      default:
        console.log(`❌ Invalid choice.`);
    }

    await ReadlineService.ask(`\nPress Enter to continue...`);
  }
}
