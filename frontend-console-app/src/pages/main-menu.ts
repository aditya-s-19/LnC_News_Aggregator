export async function mainMenuPage(): Promise<void> {
  console.log("\n🌟 Main Menu");
  console.log("1️⃣ Register");
  console.log("2️⃣ Login");
  console.log("0️⃣ Exit");

  const choice = await rl.question("Choose: ");
  switch (choice) {
    case "1":
      await registerPage();
      break;
    case "2":
      await loginPage();
      break;
    case "0":
      return exitApp();
    default:
      console.log("❌ Invalid choice");
      await mainMenu();
  }
}
