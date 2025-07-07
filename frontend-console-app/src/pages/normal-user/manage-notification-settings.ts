import axios from "axios";
import { ReadlineService } from "../../services/readline.service";
import { AppStateService } from "../../services/app-state.service";
import { normalUserMenuPage } from "./normal-user-menu";
import { handleAxiosError } from "../../helper/handle-axios-error";

export async function manageNotificationSettingsPage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return normalUserMenuPage();

  console.log("\n=== Manage Notifications ===");

  try {
    const res = await axios.get("http://localhost:3000/notification/settings", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    const settings: {
      [category: string]: { id: number; isEnabled: boolean; keywords: string[] };
    } = res.data;

    const categoryNames = Object.keys(settings);

    while (true) {
      console.log("\n🔔 Current Notification Settings:");
      categoryNames.forEach((name, index) => {
        const cat = settings[name];
        console.log(`\n${index + 1}. ${name}`);
        console.log(`   Subscribed: ${cat.isEnabled ? "✅ Yes" : "❌ No"}`);
        console.log(`   Keywords   : ${cat.keywords.join(", ") || "None"}`);
      });

      const choice = await ReadlineService.ask(
        `\nEnter the number of the category to update (or press Enter to save/go back): `
      );

      if (!choice.trim()) break;

      const index = Number(choice) - 1;
      if (isNaN(index) || index < 0 || index >= categoryNames.length) {
        console.log("❌ Invalid choice. Try again.");
        continue;
      }

      const name = categoryNames[index];
      const current = settings[name];

      const enableInput = await ReadlineService.ask(`Subscribe to "${name}"? (y/n, leave blank to skip): `);

      if (enableInput.trim()) {
        current.isEnabled = enableInput.toLowerCase() === "y";
      }

      const keywordChoice = await ReadlineService.ask(`Do you want to update keywords for "${name}"? (y/n): `);

      if (keywordChoice.toLowerCase() === "y") {
        const keywordsInput = await ReadlineService.ask(`Enter keywords for "${name}" (comma-separated): `);
        current.keywords = keywordsInput
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      console.log(`✅ Updated "${name}"`);
    }

    await axios.put("http://localhost:3000/notification/settings", settings, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    console.log("\n✅ All changes saved.");
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
