import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { registerPage } from "./register";
import { loginPage } from "./login";
import { exitAppPage } from "./exit-app";

export async function mainMenuPage(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  console.log("\n🌟 Main Menu");
  console.log("1️⃣ Register");
  console.log("2️⃣ Login");
  console.log("0️⃣ Exit");

  const choice = await rl.question("Choose: ");
  rl.close();
  switch (choice) {
    case "1":
      registerPage();
      break;
    case "2":
      loginPage();
      break;
    case "0":
      return exitAppPage();
    default:
      console.log("❌ Invalid choice");
      mainMenuPage();
  }
}
