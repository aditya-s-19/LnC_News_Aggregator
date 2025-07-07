import { PagesName } from "../constants/pages.enum";

export async function renderPage(pageFn: () => Promise<void>, title: PagesName) {
  console.clear();
  console.log(`=== ${title} ===\n`);
  await pageFn();
}
