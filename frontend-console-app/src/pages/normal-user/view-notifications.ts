import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "./normal-user-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";

export async function viewNotificationsPage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return normalUserMenuPage();

  console.log("\n🔔 Fetching new notifications...");

  try {
    const catRes = await axios.get("http://localhost:3000/article/category", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const catMap = new Map<string, string>(catRes.data.map((cat: { id: string; name: string }) => [cat.id, cat.name]));

    const res = await axios.get("http://localhost:3000/notification", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const articles = res.data;

    if (articles.length === 0) {
      console.log("✅ You're all caught up! No new articles since last check.");
    } else {
      articles.forEach((a: any, index: number) => {
        console.log(`\nId           : ${a.id}`);
        console.log(`Headline     : ${a.headline}`);
        console.log(`Description  : ${a.description}`);
        console.log("-----------------------------------------------------");
      });
    }
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
