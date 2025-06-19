export async function logout(): Promise<void> {
  token = null;
  role = null;
  name = null;
  console.log("✅ Logged out");
  await mainMenu();
}
