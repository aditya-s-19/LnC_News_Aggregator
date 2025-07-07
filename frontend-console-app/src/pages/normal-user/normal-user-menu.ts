import { logout } from "../logout";
import { searchArticlesPage } from "./search-articles";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { viewSavedArticlesPage } from "./view-saved-articles";
import { saveArticlePage } from "./save-article";
import { unsaveArticlePage } from "./unsave-article";
import { ReadlineService } from "../../services/readline.service";

export async function normalUserMenuPage(): Promise<void> {
  console.log("\n👤 User Menu");
  console.log("1️⃣ Search Articles");
  console.log("2️⃣ View Saved Articles");
  console.log("3️⃣ Save an Article");
  console.log("4️⃣ Unsave an Article");
  console.log("5️⃣ Logout");

  const choice = await ReadlineService.ask("Choose: ");
  switch (choice) {
    case "1":
      return renderPage(searchArticlesPage, PagesName.SEARCH_ARTICLES);
    case "2":
      return renderPage(viewSavedArticlesPage, PagesName.VIEW_SAVED_ARTICLES);
    case "3":
      return renderPage(saveArticlePage, PagesName.SAVE_ARTICLE);
    case "4":
      return renderPage(unsaveArticlePage, PagesName.UNSAVE_ARTICLE);
    case "5":
      return renderPage(logout, PagesName.LOGOUT);
    default:
      console.log("❌ Invalid choice");
      return renderPage(normalUserMenuPage, PagesName.USER_MENU);
  }
}
