import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { normalUserMenuPage } from "./normal-user-menu";
import { ReadlineService } from "../../services/readline.service";

export async function saveArticlePage(): Promise<void> {
  const appState = AppStateService.getInstance();
  const user = appState.getUser();
  if (!user) return;

  const id = await ReadlineService.ask("Enter Article ID to save: ");

  try {
    await axios.post(`http://localhost:3000/article/save/${id}`, null, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    console.log("✅ Article saved successfully.");
  } catch (err) {
    handleAxiosError(err);
  }

  return normalUserMenuPage();
}
