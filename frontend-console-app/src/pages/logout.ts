import { AppStateService } from "../services/app-state.service";
import { mainMenuPage } from "./main-menu";

export async function logout(): Promise<void> {
  const appState = AppStateService.getInstance();
  appState?.resetUser();
  console.log("✅ Logged out");
  await mainMenuPage();
}
