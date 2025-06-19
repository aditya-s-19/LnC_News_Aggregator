export async function adminUserPage(): Promise<void> {
  console.log(`👑 Hello admin ${name}, the admin panel is still being constructed.`);
  await logout();
}
