import { AppStateService } from "../services/app-state.service";
import { logout } from "./logout";

export async function adminUserPage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  console.log(`👑 Hello admin ${user?.name}, the admin panel is still being constructed.`);
  await logout();
}
