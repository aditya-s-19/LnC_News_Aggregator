import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ArticleValidator } from './article.validator';
import { ArticleController } from './article.controller';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  controllers: [ArticleController],
  providers: [
    ArticleService,
    ArticleValidator,
    NewsApiAdapter,
    TheNewsApiAdapter,
  ],
  exports: [ArticleValidator, ArticleService],
})
export class ArticleModule {}
