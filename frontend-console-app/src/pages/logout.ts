import { AppStateService } from "../services/app-state.service";
import { PagesName } from "../utils/constants/pages.enum";
import { renderPage } from "../utils/helper/runPage";
import { mainMenuPage } from "./main-menu";

export async function logout(): Promise<void> {
  const appState = AppStateService.getInstance();
  appState?.resetUser();
  console.log("✅ Logged out");
  return renderPage(mainMenuPage, PagesName.MAIN_MENU);
}
