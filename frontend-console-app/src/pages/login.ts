export async function loginPage(): Promise<void> {
  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");

  try {
    const res = await axios.post("http://localhost:3000/auth/login", { email, password });
    token = res.data.accessToken;
    role = res.data.role;
    name = res.data.username;

    console.log(`✅ Logged in as ${name} (${role})`);
    if (role === "admin") {
      await adminPage();
    } else {
      await userPage();
    }
  } catch (err) {
    handleAxiosError(err);
    await mainMenu();
  }
}
