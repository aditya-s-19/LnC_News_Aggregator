export async function exitAppPage(): Promise<void> {
  console.log("👋 Goodbye!");
  rl.close();
}
