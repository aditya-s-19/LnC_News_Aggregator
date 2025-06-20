import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import { NewsAdapter } from 'src/interfaces/news-adapter.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { apiName } from '../enums/api-name.enum';

export const adapterPriority: {
  name: apiName;
  adapter: NewsAdapter;
}[] = [
  {
    name: apiName.NEWS_API,
    adapter: new NewsApiAdapter(new PrismaService()),
  },
  {
    name: apiName.THE_NEWS_API,
    adapter: new TheNewsApiAdapter(new PrismaService()),
  },
];
