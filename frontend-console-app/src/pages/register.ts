import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import axios from "axios";
import { handleAxiosError } from "../helper/handle-axios-error";
import { mainMenuPage } from "./main-menu";

export async function registerPage(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");
  const username = await rl.question("Name: ");
  rl.close();

  try {
    await axios.post("http://localhost:3000/auth/register", { email, password, name: username });
    console.log("✅ Registered successfully!");
  } catch (err) {
    handleAxiosError(err);
  }

  await mainMenuPage();
}
