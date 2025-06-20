import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import axios from "axios";
import { AppStateService } from "../services/app-state.service";
import { mainMenuPage } from "./main-menu";
import { handleAxiosError } from "../helper/handle-axios-error";
import { normalUserPage } from "./normal-user";

export async function searchArticlesPage(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const appState: AppStateService = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return mainMenuPage();

  const query = await rl.question("Search: ");
  rl.close();

  try {
    const res = await axios.get(`http://localhost:3000/articles?search=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    const articles = res.data;
    if (articles.length === 0) {
      console.log("❌ No articles found.");
    } else {
      articles.forEach((a: any) => console.log(`- ${a.headline} (${a.url})`));
    }
  } catch (err) {
    handleAxiosError(err);
  }

  await normalUserPage();
}
