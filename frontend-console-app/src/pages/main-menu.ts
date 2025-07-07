import { registerPage } from "./register";
import { loginPage } from "./login";
import { exitAppPage } from "./exit-app";
import { renderPage } from "../utils/helper/runPage";
import { PagesName } from "../utils/constants/pages.enum";
import { ReadlineService } from "../services/readline.service";

export async function mainMenuPage(): Promise<void> {
  console.log("\n🌟 Main Menu");
  console.log("1️⃣ Register");
  console.log("2️⃣ Login");
  console.log("0️⃣ Exit");

  const choice = await ReadlineService.ask("Choose: ");

  switch (choice) {
    case "1":
      return renderPage(registerPage, PagesName.REGISTER);
    case "2":
      return renderPage(loginPage, PagesName.LOGIN);
    case "0":
      return renderPage(exitAppPage, PagesName.EXIT);
    default:
      console.log("❌ Invalid choice");
      return renderPage(mainMenuPage, PagesName.MAIN_MENU);
  }
}
