import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleValidator } from './article.validator';
import { jwtPayload } from 'src/utils/types/jwt-payload';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ArticleResponseDto } from './dtos/article-response.dto';
import { AuthValidator } from 'src/auth/auth.validator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@Controller('article')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly articleValidator: ArticleValidator,
    private readonly authValidator: AuthValidator,
  ) {}

  @Get('category')
  async getCategories() {
    return await this.articleService.getCategories();
  }

  @Get()
  async getArticles(
    @Req() req: { user: jwtPayload },
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category_id') category_id?: string,
    @Query('search') search?: string,
    @Query('order') order?: string, // ✅ keep only this
  ): Promise<ArticleResponseDto[]> {
    const userId = req.user.userId;
    await this.authValidator.userIdShouldExist(userId);

    const validated = this.articleValidator.validateArticleQuery(
      from,
      to,
      category_id,
      search,
      order,
    );

    return await this.articleService.getArticles(userId, validated);
  }

  @Get('saved')
  async getSavedArticles(@Req() req: { user: jwtPayload }) {
    const userId = req.user.userId;
    await this.authValidator.userIdShouldExist(userId);
    return await this.articleService.getSavedArticles(userId);
  }

  @Post('save/:id')
  async saveArticle(
    @Req() req: { user: jwtPayload },
    @Param('id') articleId: number,
  ) {
    const userId = req.user.userId;
    await this.authValidator.userIdShouldExist(userId);
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.articleShouldNotBeAlreadySaved(
      userId,
      articleId,
    );
    await this.articleService.saveArticle(userId, articleId);
  }

  @Delete('save/:id')
  async unsaveArticle(
    @Req() req: { user: jwtPayload },
    @Param('id') articleId: number,
  ) {
    const userId = req.user.userId;
    await this.authValidator.userIdShouldExist(userId);
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.articleShouldBeAlreadySaved(userId, articleId);
    await this.articleService.unsaveArticle(userId, articleId);
  }

  @Get('reactions')
  async getReactions() {
    return await this.articleService.getReactions();
  }

  @Put(':articleId/reaction/:reactionId')
  async reactToArticle(
    @Req() req: { user: jwtPayload },
    @Param('articleId') articleId: number,
    @Param('reactionId') reactionId: number,
  ) {
    const userId = req.user.userId;
    await this.authValidator.userIdShouldExist(userId);
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.reactionIdShouldExist(reactionId);
    await this.articleService.reactToArticle(userId, articleId, reactionId);
  }

  @Delete(':articleId/reaction')
  async removeReaction(
    @Req() req: { user: jwtPayload },
    @Param('articleId') articleId: number,
  ) {
    const userId = req.user.userId;
    this.authValidator.userIdShouldExist(userId);
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.articleReactionShouldExist(userId, articleId);
    await this.articleService.removeReaction(userId, articleId);
  }
}
