import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { normalUserMenuPage } from "./normal-user-menu";
import { ReadlineService } from "../../services/readline.service";

export async function unsaveArticlePage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return;

  const id = await ReadlineService.ask("Enter Article ID to unsave: ");

  try {
    await axios.delete(`http://localhost:3000/article/save/${id}`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    console.log("✅ Article unsaved successfully.");
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
