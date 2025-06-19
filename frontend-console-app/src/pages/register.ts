export async function registerPage(): Promise<void> {
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");
  const username = await rl.question("Name: ");

  try {
    await axios.post("http://localhost:3000/auth/register", { email, password, name: username });
    console.log("✅ Registered successfully!");
  } catch (err) {
    handleAxiosError(err);
  }

  await mainMenu();
}
