export async function searchArticlesPage(): Promise<void> {
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
