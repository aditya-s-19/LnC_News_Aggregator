import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { mainMenuPage } from "../main-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { normalUserMenuPage } from "./normal-user-menu";
import { ReadlineService } from "../../services/readline.service";

export async function searchArticlesPage(): Promise<void> {
  const appState: AppStateService = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return mainMenuPage();

  try {
    const catRes = await axios.get("http://localhost:3000/article/category", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    console.log("\n📚 Available Categories:");
    catRes.data.forEach((c: any) => {
      console.log(`- ${c.id}: ${c.name}`);
    });
  } catch (e) {
    console.log("⚠️  Could not load categories.", e);
  }

  const orderOptions: Record<string, string> = {
    "1": "date:desc",
    "2": "date:asc",
    "3": "likes:desc",
    "4": "likes:asc",
    "5": "dislikes:desc",
    "6": "dislikes:asc",
  };

  console.log("\n🔍 Article Search Options");
  const search = await ReadlineService.ask("Keyword (optional): ");
  const from = await ReadlineService.ask("From Date (YYYY-MM-DD) (optional): ");
  const to = await ReadlineService.ask("To Date (YYYY-MM-DD) (optional): ");
  const category_id = await ReadlineService.ask("Category ID (optional): ");

  console.log("\n📊 Sort Articles By:");
  console.log("1. Date (desc)");
  console.log("2. Date (asc)");
  console.log("3. Likes (desc)");
  console.log("4. Likes (asc)");
  console.log("5. Dislikes (desc)");
  console.log("6. Dislikes (asc)");

  const orderChoice = await ReadlineService.ask("Choose sorting option (default: 1): ");
  let order = orderOptions[0];
  if (orderOptions[orderChoice]) {
    order = orderOptions[orderChoice];
  } else if (orderChoice.length) {
    console.log("Invalid sort choice, defaulting to ", orderOptions[0]);
  }

  const params: Record<string, string> = {};
  if (search.trim()) params.search = search.trim();
  if (from.trim()) params.from = from.trim();
  if (to.trim()) params.to = to.trim();
  if (category_id.trim()) params.category_id = category_id.trim();
  params.order = order;

  try {
    const res = await axios.get("http://localhost:3000/article", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      params,
    });

    const articles = res.data;
    if (articles.length === 0) {
      console.log("❌ No articles found.");
      return await normalUserMenuPage();
    }

    articles.forEach((a: any, index: number) => {
      console.log(`\n📰 Article ${index + 1}`);
      console.log(`ID           : ${a.id}`);
      console.log(`Headline     : ${a.headline}`);
      console.log(`Description  : ${a.description}`);
      console.log(`Source       : ${a.source}`);
      console.log(`Published At : ${new Date(a.published_at).toLocaleString()}`);
      console.log(`URL          : ${a.url}`);
      console.log(`Saved        : ${a.isSaved ? "✅ Yes" : "❌ No"}`);
      console.log(`Reaction     : ${a.reaction_id ?? "None"}`);
      console.log("--------------------------------------------------------");
    });

    const reactionsRes = await axios.get("http://localhost:3000/article/reactions", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    console.log("\n❤️ Available Reactions:");
    reactionsRes.data.forEach((r: any) => {
      console.log(`${r.id} = ${r.name.charAt(0).toUpperCase() + r.name.slice(1)}`);
    });

    const action = await ReadlineService.ask(
      "\nDo you want to (1) Add/Update a reaction or (2) Remove a reaction? (press Enter to skip): "
    );

    if (action === "1") {
      const articleId = await ReadlineService.ask("Enter Article ID to react to: ");
      const reactionId = await ReadlineService.ask("Enter Reaction ID: ");

      await axios.put(
        `http://localhost:3000/article/${articleId}/reaction/${reactionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        }
      );
      console.log("✅ Reaction added/updated.");
    } else if (action === "2") {
      const articleId = await ReadlineService.ask("Enter Article ID to remove reaction from: ");

      await axios.delete(`http://localhost:3000/article/${articleId}/reaction`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      console.log("🗑️ Reaction removed.");
    }
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
