import axios from "axios";
import { AppStateService } from "../services/app-state.service";
import { adminUserMenuPage } from "./admin-user/admin-user-menu";
import { normalUserMenuPage } from "./normal-user/normal-user-menu";
import { handleAxiosError } from "../helper/handle-axios-error";
import { mainMenuPage } from "./main-menu";
import { renderPage } from "../utils/helper/runPage";
import { PagesName } from "../utils/constants/pages.enum";
import { ReadlineService } from "../services/readline.service";

export async function loginPage(): Promise<void> {
  const email = await ReadlineService.ask("Email: ");
  const password = await ReadlineService.ask("Password: ");

  try {
    const res = await axios.post("http://localhost:3000/auth/login", { email, password });
    const { accessToken, role, username: name } = res.data;

    const appState = AppStateService.getInstance();
    appState.setUser({ name, role, accessToken });

    console.log(`✅ Logged in as ${name} (${role})`);
    return renderPage(
      role === "admin" ? adminUserMenuPage : normalUserMenuPage,
      role === "admin" ? PagesName.ADMIN_MENU : PagesName.USER_MENU
    );
  } catch (err) {
    handleAxiosError(err);
    return renderPage(mainMenuPage, PagesName.MAIN_MENU);
  }
}
