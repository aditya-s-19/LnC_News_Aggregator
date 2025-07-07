import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "./normal-user-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";

export async function viewRecommendationsPage(): Promise<void> {
  const user = AppStateService.getInstance().getUser();
  if (!user) return normalUserMenuPage();

  console.log("\n🧠 Recommended Articles Based on Your Interests:\n");

  try {
    const res = await axios.get("http://localhost:3000/article/recommendations", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    const articles = res.data;

    if (articles.length === 0) {
      console.log("🤷 No recommendations available right now.");
    } else {
      articles.forEach((article: any) => {
        console.log(`\nId            : ${article.id}`);
        console.log(`Headline      : ${article.headline}`);
        console.log(`Description   : ${article.description}`);
        console.log(`Category_id   : ${article.category_id}`);
        console.log("--------------------------------------------------");
      });
    }
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
