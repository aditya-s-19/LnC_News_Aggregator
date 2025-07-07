import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminValidator } from './admin.validator';
import { UpdateSourceRequestDto } from './dtos/update-source-request.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { ArticleValidator } from '../article/article.validator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminValidator: AdminValidator,
    private articleValidator: ArticleValidator,
  ) {}

  @Get('sources')
  async getSources() {
    return await this.adminService.getSources();
  }

  @Put('source/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateSourceRequestDto,
  ) {
    await this.adminValidator.sourceShouldExist(+id);
    return await this.adminService.updateSource(+id, dto);
  }

  @Post('category/add/:name')
  async addCategory(@Param('name') name: string) {
    await this.adminValidator.categoryShouldNotExist(name);
    return await this.adminService.addCategory(name);
  }

  @Get('reports')
  async getReportedArticles() {
    return await this.adminService.getReportedArticlesWithCounts();
  }

  @Post('article/:id/hide')
  async hideArticle(@Param('id', ParseIntPipe) articleId: number) {
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.articleIdShouldNotBeHidden(articleId);
    await this.adminService.setArticleHidden(articleId, true);
    return { message: 'Article hidden' };
  }

  @Post('article/:id/unhide')
  async unhideArticle(@Param('id', ParseIntPipe) articleId: number) {
    await this.articleValidator.articleIdShouldExist(articleId);
    await this.articleValidator.articleIdShouldBeHidden(articleId);
    await this.adminService.setArticleHidden(articleId, false);
    return { message: 'Article unhidden' };
  }

  @Post('category/:id/hide')
  async hideCategory(@Param('id', ParseIntPipe) categoryId: number) {
    await this.articleValidator.categoryIdShouldNotBeHidden(categoryId);
    await this.adminService.setCategoryHidden(categoryId, true);
    return { message: 'Category hidden' };
  }

  @Post('category/:id/unhide')
  async unhideCategory(@Param('id', ParseIntPipe) categoryId: number) {
    await this.articleValidator.categoryIdShouldBeHidden(categoryId);
    await this.adminService.setCategoryHidden(categoryId, false);
    return { message: 'Category unhidden' };
  }

  @Post('hidden-keywords')
  async addHiddenKeyword(@Body('keyword') keyword: string) {
    await this.adminService.addHiddenKeyword(keyword);
    return { message: 'Keyword added to censorship list' };
  }

  @Delete('hidden-keywords/:id')
  async removeHiddenKeyword(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.removeHiddenKeyword(id);
    return { message: 'Keyword removed from censorship list' };
  }

  @Get('moderation-status')
  async getModerationStatus() {
    return await this.adminService.getModerationStatus();
  }
}
