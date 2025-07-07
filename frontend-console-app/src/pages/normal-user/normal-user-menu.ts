import { logout } from "../logout";
import { searchArticlesPage } from "./search-articles";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { viewSavedArticlesPage } from "./view-saved-articles";
import { saveArticlePage } from "./save-article";
import { unsaveArticlePage } from "./unsave-article";
import { ReadlineService } from "../../services/readline.service";
import { manageNotificationSettingsPage } from "./manage-notification-settings"; // ✅ new import
import { viewNotificationsPage } from "./view-notifications"; // ✅ new import
import { reportArticlePage } from "./report-article";
import { viewArticleDetailPage } from "./view-article-detail";
import { viewRecommendationsPage } from "./view-recommendation";

export async function normalUserMenuPage(): Promise<void> {
  console.log("\n👤 User Menu");
  console.log(" 1 Search Articles");
  console.log(" 2 See Article in Detail");
  console.log(" 3 See Recommendations");
  console.log(" 4 View Saved Articles");
  console.log(" 5 Save an Article");
  console.log(" 6 Unsave an Article");
  console.log(" 7 Manage Notification Settings");
  console.log(" 8 View Notifications"); // ✅ new option
  console.log(" 9 Report an Article");
  console.log(" 10 Logout");

  const choice = await ReadlineService.ask("Choose: ");
  switch (choice) {
    case "1":
      return renderPage(searchArticlesPage, PagesName.SEARCH_ARTICLES);
    case "2":
      return renderPage(viewArticleDetailPage, PagesName.VIEW_ARTICLE_DETAILS);
    case "3":
      return renderPage(viewRecommendationsPage, PagesName.VIEW_RECOMMENDATIONS);
    case "4":
      return renderPage(viewSavedArticlesPage, PagesName.VIEW_SAVED_ARTICLES);
    case "5":
      return renderPage(saveArticlePage, PagesName.SAVE_ARTICLE);
    case "6":
      return renderPage(unsaveArticlePage, PagesName.UNSAVE_ARTICLE);
    case "7":
      return renderPage(manageNotificationSettingsPage, PagesName.MANAGE_NOTIFICATIONS);
    case "8":
      return renderPage(viewNotificationsPage, PagesName.VIEW_NOTIFICATIONS); // ✅
    case "9":
      await renderPage(reportArticlePage, PagesName.REPORT_ARTICLE);
      break;
    case "10":
      return renderPage(logout, PagesName.LOGOUT);
    default:
      console.log("❌ Invalid choice");
      return renderPage(normalUserMenuPage, PagesName.USER_MENU);
  }
}
