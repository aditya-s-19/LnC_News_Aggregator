import { searchArticlesPage } from "./search-articles";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { logout } from "./logout";

export async function normalUserPage(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  console.log("\n👤 User Menu");
  console.log("1️⃣ Search Articles");
  console.log("2️⃣ Logout");

  const choice = await rl.question("Choose: ");
  rl.close();
  switch (choice) {
    case "1":
      await searchArticlesPage();
      break;
    case "2":
      await logout();
      break;
    default:
      console.log("❌ Invalid choice");
      await normalUserPage();
  }
}
