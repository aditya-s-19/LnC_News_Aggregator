import axios from "axios";
import { handleAxiosError } from "../helper/handle-axios-error";
import { mainMenuPage } from "./main-menu";
import { renderPage } from "../utils/helper/runPage";
import { PagesName } from "../utils/constants/pages.enum";
import { ReadlineService } from "../services/readline.service";

export async function registerPage(): Promise<void> {
  const email = await ReadlineService.ask("Email: ");
  const password = await ReadlineService.ask("Password: ");
  const username = await ReadlineService.ask("Name: ");

  try {
    await axios.post("http://localhost:3000/auth/register", { email, password, name: username });
    console.log("✅ Registered successfully!");
  } catch (err) {
    handleAxiosError(err);
  }

  return renderPage(mainMenuPage, PagesName.MAIN_MENU);
}
