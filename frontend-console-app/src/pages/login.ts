import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import axios from "axios";
import { AppStateService } from "../services/app-state.service";
import { adminUserPage } from "./admin-user";
import { normalUserPage } from "./normal-user";
import { handleAxiosError } from "../helper/handle-axios-error";
import { mainMenuPage } from "./main-menu";

export async function loginPage(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");

  try {
    const res = await axios.post("http://localhost:3000/auth/login", { email, password });
    const accessToken = res.data.accessToken;
    const role = res.data.role;
    const name = res.data.username;

    const appState = AppStateService.getInstance();
    appState?.setUser({
      name,
      role,
      accessToken,
    });
    rl.close();
    console.log(`✅ Logged in as ${name} (${role})`);
    if (role === "admin") {
      await adminUserPage();
    } else {
      await normalUserPage();
    }
  } catch (err) {
    handleAxiosError(err);
    await mainMenuPage();
  }
}
