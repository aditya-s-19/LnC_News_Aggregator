import axios from "axios";
import { AppStateService } from "../../services/app-state.service";
import { handleAxiosError } from "../../helper/handle-axios-error";
import { ReadlineService } from "../../services/readline.service";

const api = "http://localhost:3000";

export async function viewReports() {
  const user = AppStateService.getInstance().getUser();
  try {
    const res = await axios.get(`${api}/admin/reports`, {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
    });

    if (res.data.length === 0) {
      console.log(`✅ No reported articles.`);
      return;
    }
    const articleReports = res.data;
    let articleCount = 1;
    for (const report of articleReports) {
      console.log(`\n${articleCount++}. 📰 ${report.article.headline}`);
      console.log(`   🆔 ID: ${report.article.id}`);
      console.log(`   🗂️ Category id: ${report.article.category_id}`);
      console.log(`   📝 Description: ${report.article.description}`);
      console.log(`   🚨 Reports: ${report.count}`);
    }
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function hideArticle() {
  await toggleArticle(true);
}
export async function unhideArticle() {
  await toggleArticle(false);
}
async function toggleArticle(hide: boolean) {
  const user = AppStateService.getInstance().getUser();
  const id = await ReadlineService.ask(`Enter article ID to ${hide ? "hide" : "unhide"}: `);
  try {
    await axios.post(`${api}/admin/article/${id}/${hide ? "hide" : "unhide"}`, null, {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
    });
    console.log(`✅ Article ${id} has been ${hide ? "hidden" : "unhidden"}.`);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function hideCategory() {
  await toggleCategory(true);
}
export async function unhideCategory() {
  await toggleCategory(false);
}
async function toggleCategory(hide: boolean) {
  const user = AppStateService.getInstance().getUser();
  const id = await ReadlineService.ask(`Enter category ID to ${hide ? "hide" : "unhide"}: `);
  try {
    await axios.post(`${api}/admin/category/${id}/${hide ? "hide" : "unhide"}`, null, {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
    });
    console.log(`✅ Category ${id} has been ${hide ? "hidden" : "unhidden"}.`);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function addHiddenKeyword() {
  const user = AppStateService.getInstance().getUser();
  const keyword = await ReadlineService.ask("Enter keyword to censor: ");
  try {
    await axios.post(
      `${api}/admin/hidden-keywords`,
      { keyword },
      {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
      }
    );
    console.log(`✅ Keyword "${keyword}" has been added.`);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function removeHiddenKeyword() {
  const user = AppStateService.getInstance().getUser();
  const id = await ReadlineService.ask("Enter keyword ID to remove: ");
  try {
    await axios.delete(`${api}/admin/hidden-keywords/${id}`, {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
    });
    console.log(`✅ Keyword with ID ${id} has been removed.`);
  } catch (err) {
    handleAxiosError(err);
  }
}

export async function getModerationStatus() {
  const user = AppStateService.getInstance().getUser();
  try {
    const res = await axios.get(`${api}/admin/moderation-status`, {
      headers: { Authorization: `Bearer ${user?.accessToken}` },
    });
    return res.data;
  } catch (err) {
    handleAxiosError(err);
  }
}
