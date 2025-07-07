import axios from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "./normal-user-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";

export async function viewSavedArticlesPage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return;

  try {
    const res = await axios.get(`http://localhost:3000/article/saved`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    const articles = res.data;
    if (articles.length === 0) {
      console.log("❌ No saved articles.");
    } else {
      articles.forEach((a: any, index: number) => {
        console.log(`\n💾 Saved Article ${index + 1}`);
        console.log(`ID           : ${a.id}`);
        console.log(`Headline     : ${a.headline}`);
        console.log(`Description  : ${a.description}`);
        console.log(`Source       : ${a.source}`);
        console.log(`Published At : ${new Date(a.published_at).toLocaleString()}`);
        console.log(`URL          : ${a.url}`);
        console.log(`Reaction     : ${a.reaction_id ?? "None"}`);
        console.log("--------------------------------------------------------");
      });
    }
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
