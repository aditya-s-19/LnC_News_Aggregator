export async function normalUserPage(): Promise<void> {
  console.log("\n👤 User Menu");
  console.log("1️⃣ Search Articles");
  console.log("2️⃣ Logout");

  const choice = await rl.question("Choose: ");
  switch (choice) {
    case "1":
      await searchArticlesPage();
      break;
    case "2":
      await logout();
      break;
    default:
      console.log("❌ Invalid choice");
      await userPage();
  }
}
