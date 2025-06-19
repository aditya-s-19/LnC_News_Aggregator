import { NewsArticle } from './news-article.interface';

export interface NewsAdapter {
  fetchArticles(from: Date, to: Date): Promise<NewsArticle[]>;
}
