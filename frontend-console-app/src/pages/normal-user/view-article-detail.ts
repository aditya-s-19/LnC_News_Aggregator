import axios from "axios";
import { ReadlineService } from "../../services/readline.service";
import { AppStateService } from "../../services/app-state.service";
import { mainMenuPage } from "../main-menu";
import { renderPage } from "../../utils/helper/runPage";
import { PagesName } from "../../utils/constants/pages.enum";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { normalUserMenuPage } from "./normal-user-menu";

export async function viewArticleDetailPage(): Promise<void> {
  const user = AppStateService.getInstance().getUser();
  if (!user) return renderPage(mainMenuPage, PagesName.MAIN_MENU);

  const id = await ReadlineService.ask("Enter article ID to view: ");
  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    console.log("❌ Invalid article ID.");
    return;
  }

  try {
    const res = await axios.get(`http://localhost:3000/article/${id}`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const article = res.data;
    console.clear();
    console.log(`\nID           : ${article.id}`);
    console.log(`Headline     : ${article.headline}`);
    console.log(`Description  : ${article.description}`);
    console.log(`Source       : ${article.source}`);
    console.log(`Published At : ${new Date(article.published_at).toLocaleString()}`);
    console.log(`URL          : ${article.url}`);
    console.log(`Saved        : ${article.isSaved ? "✅ Yes" : "❌ No"}`);
    console.log(`Reaction     : ${article.reaction_id ?? "None"}`);
    console.log("--------------------------------------------------------");
  } catch (err: any) {
    handleAxiosError(err);
  }

  return renderPage(normalUserMenuPage, PagesName.USER_MENU);
}
