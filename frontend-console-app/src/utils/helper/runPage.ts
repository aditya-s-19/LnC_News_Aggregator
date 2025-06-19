import { PagesName } from "../constants/pages.enum";

export async function runPage(pageFn: () => Promise<void>, title: PagesName) {
  console.clear();
  console.log(`=== ${title} ===\n`);
  await pageFn();
}
