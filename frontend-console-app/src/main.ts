import axios, { AxiosError } from "axios";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const rl = readline.createInterface({ input, output });
let token: string | null = null;
let role: string | null = null;
let name: string | null = null;

async function mainMenu(): Promise<void> {
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

async function registerPage(): Promise<void> {
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

async function loginPage(): Promise<void> {
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

async function userPage(): Promise<void> {
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

async function adminPage(): Promise<void> {
  console.log(`👑 Hello admin ${name}, the admin panel is still being constructed.`);
  await logout();
}

async function searchArticlesPage(): Promise<void> {
  const query = await rl.question("Search: ");

  try {
    const res = await axios.get(`http://localhost:3000/articles/search?query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const articles = res.data;
    if (articles.length === 0) {
      console.log("❌ No articles found.");
    } else {
      articles.forEach((a: any) => console.log(`- ${a.headline} (${a.url})`));
    }
  } catch (err) {
    handleAxiosError(err);
  }

  await userPage();
}

async function logout(): Promise<void> {
  token = null;
  role = null;
  name = null;
  console.log("✅ Logged out");
  await mainMenu();
}

async function exitApp(): Promise<void> {
  console.log("👋 Goodbye!");
  rl.close();
}

function handleAxiosError(err: unknown): void {
  if (axios.isAxiosError(err)) {
    console.log("❌ Error:", err.response?.data?.message || err.message);
  } else {
    console.log("❌ Unknown error:", err);
  }
}

// Start the app
mainMenu();
