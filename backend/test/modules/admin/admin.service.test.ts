import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from 'src/modules/admin/admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock PrismaService
const mockPrismaService = {
  newsSource: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  category: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  userReportedArticle: {
    findMany: jest.fn(),
  },
  article: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  hiddenArticleKeyword: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSources', () => {
    it('should return all news sources successfully', async () => {
      // Arrange
      const mockSources = [
        {
          id: 1,
          name: 'NewsAPI',
          api_key: 'key1',
          status: 'Active',
          last_accessed: new Date(),
        },
        {
          id: 2,
          name: 'TheNewsAPI',
          api_key: 'key2',
          status: 'Inactive',
          last_accessed: new Date(),
        },
      ];
      jest
        .spyOn(prismaService.newsSource, 'findMany')
        .mockResolvedValue(mockSources);

      // Act
      const result = await service.getSources();

      // Assert
      expect(prismaService.newsSource.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSources);
    });

    it('should return empty array when no sources exist', async () => {
      // Arrange
      jest.spyOn(prismaService.newsSource, 'findMany').mockResolvedValue([]);

      // Act
      const result = await service.getSources();

      // Assert
      expect(prismaService.newsSource.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe('updateSource', () => {
    it('should update source successfully with new data', async () => {
      // Arrange
      const sourceId = 1;
      const updateDto = { name: 'Updated NewsAPI', api_key: 'new-key' };
      const mockUpdatedSource = {
        id: sourceId,
        ...updateDto,
        status: 'Active',
        last_accessed: new Date(),
      };
      jest
        .spyOn(prismaService.newsSource, 'update')
        .mockResolvedValue(mockUpdatedSource);

      // Act
      const result = await service.updateSource(sourceId, updateDto);

      // Assert
      expect(prismaService.newsSource.update).toHaveBeenCalledWith({
        where: { id: sourceId },
        data: {
          ...updateDto,
          last_accessed: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUpdatedSource);
    });

    it('should handle source update errors gracefully', async () => {
      // Arrange
      const sourceId = 999;
      const updateDto = { name: 'Updated NewsAPI', api_key: 'new-key' };
      const updateError = new Error('Source not found');
      jest
        .spyOn(prismaService.newsSource, 'update')
        .mockRejectedValue(updateError);

      // Act & Assert
      await expect(service.updateSource(sourceId, updateDto)).rejects.toThrow(
        'Source not found',
      );
      expect(prismaService.newsSource.update).toHaveBeenCalledWith({
        where: { id: sourceId },
        data: {
          ...updateDto,
          last_accessed: expect.any(Date),
        },
      });
    });
  });

  describe('addCategory', () => {
    it('should create new category successfully', async () => {
      // Arrange
      const categoryName = 'Technology';
      const mockCategory = { id: 1, name: categoryName, isHidden: false };
      jest
        .spyOn(prismaService.category, 'create')
        .mockResolvedValue(mockCategory);

      // Act
      const result = await service.addCategory(categoryName);

      // Assert
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { name: categoryName, isHidden: false },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should handle category creation errors gracefully', async () => {
      // Arrange
      const categoryName = 'Technology';
      const creationError = new Error('Category creation failed');
      jest
        .spyOn(prismaService.category, 'create')
        .mockRejectedValue(creationError);

      // Act & Assert
      await expect(service.addCategory(categoryName)).rejects.toThrow(
        'Category creation failed',
      );
      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: { name: categoryName, isHidden: false },
      });
    });
  });

  describe('getReportedArticlesWithCounts', () => {
    it('should return grouped reported articles with counts successfully', async () => {
      // Arrange
      const mockReports = [
        {
          id: 1,
          article_id: 1,
          user_id: 1,
          created_at: new Date(),
          article: {
            id: 1,
            category_id: 1,
            isHidden: false,
            headline: 'Article 1',
            description: 'desc',
            source: 'source',
            url: 'url1',
            published_at: new Date(),
            created_at: new Date(),
            like_count: 0,
            dislike_count: 0,
          },
          user: { id: 1, email: 'user1@test.com' },
        },
        {
          id: 2,
          article_id: 1,
          user_id: 2,
          created_at: new Date(),
          article: {
            id: 1,
            category_id: 1,
            isHidden: false,
            headline: 'Article 1',
            description: 'desc',
            source: 'source',
            url: 'url1',
            published_at: new Date(),
            created_at: new Date(),
            like_count: 0,
            dislike_count: 0,
          },
          user: { id: 2, email: 'user2@test.com' },
        },
        {
          id: 3,
          article_id: 2,
          user_id: 3,
          created_at: new Date(),
          article: {
            id: 2,
            category_id: 2,
            isHidden: false,
            headline: 'Article 2',
            description: 'desc',
            source: 'source',
            url: 'url2',
            published_at: new Date(),
            created_at: new Date(),
            like_count: 0,
            dislike_count: 0,
          },
          user: { id: 3, email: 'user3@test.com' },
        },
      ];
      jest
        .spyOn(prismaService.userReportedArticle, 'findMany')
        .mockResolvedValue(mockReports);

      // Act
      const result = await service.getReportedArticlesWithCounts();

      // Assert
      expect(prismaService.userReportedArticle.findMany).toHaveBeenCalledWith({
        include: {
          article: true,
          user: true,
        },
      });
      expect(result).toEqual([
        {
          article: {
            id: 1,
            category_id: 1,
            isHidden: false,
            headline: 'Article 1',
            description: 'desc',
            source: 'source',
            url: 'url1',
            published_at: expect.any(Date),
            created_at: expect.any(Date),
            like_count: 0,
            dislike_count: 0,
          },
          count: 2,
          reporters: [
            { id: 1, email: 'user1@test.com' },
            { id: 2, email: 'user2@test.com' },
          ],
        },
        {
          article: {
            id: 2,
            category_id: 2,
            isHidden: false,
            headline: 'Article 2',
            description: 'desc',
            source: 'source',
            url: 'url2',
            published_at: expect.any(Date),
            created_at: expect.any(Date),
            like_count: 0,
            dislike_count: 0,
          },
          count: 1,
          reporters: [{ id: 3, email: 'user3@test.com' }],
        },
      ]);
    });

    it('should return empty array when no reported articles exist', async () => {
      // Arrange
      jest
        .spyOn(prismaService.userReportedArticle, 'findMany')
        .mockResolvedValue([]);

      // Act
      const result = await service.getReportedArticlesWithCounts();

      // Assert
      expect(prismaService.userReportedArticle.findMany).toHaveBeenCalledWith({
        include: {
          article: true,
          user: true,
        },
      });
      expect(result).toEqual([]);
    });
  });

  describe('setArticleHidden', () => {
    it('should hide article successfully when article exists and is not already hidden', async () => {
      // Arrange
      const articleId = 1;
      const mockArticle = {
        id: 1,
        category_id: 1,
        isHidden: false,
        headline: 'Article 1',
        description: 'desc',
        source: 'source',
        url: 'url1',
        published_at: new Date(),
        created_at: new Date(),
        like_count: 0,
        dislike_count: 0,
      };
      const mockUpdatedArticle = { ...mockArticle, isHidden: true };
      jest
        .spyOn(prismaService.article, 'findUnique')
        .mockResolvedValue(mockArticle);
      jest
        .spyOn(prismaService.article, 'update')
        .mockResolvedValue(mockUpdatedArticle);

      // Act
      await service.setArticleHidden(articleId, true);

      // Assert
      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
      });
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: { isHidden: true },
      });
    });

    it('should throw ConflictException when article is already in target state', async () => {
      // Arrange
      const articleId = 1;
      const mockArticle = {
        id: 1,
        category_id: 1,
        isHidden: true,
        headline: 'Article 1',
        description: 'desc',
        source: 'source',
        url: 'url1',
        published_at: new Date(),
        created_at: new Date(),
        like_count: 0,
        dislike_count: 0,
      };
      jest
        .spyOn(prismaService.article, 'findUnique')
        .mockResolvedValue(mockArticle);

      // Act & Assert
      await expect(service.setArticleHidden(articleId, true)).rejects.toThrow(
        new ConflictException('Article already hidden'),
      );
      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
      });
      expect(prismaService.article.update).not.toHaveBeenCalled();
    });
  });

  describe('setCategoryHidden', () => {
    it('should hide category successfully when category exists and is not already hidden', async () => {
      // Arrange
      const categoryId = 1;
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        isHidden: false,
      };
      const mockUpdatedCategory = { ...mockCategory, isHidden: true };
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.category, 'update')
        .mockResolvedValue(mockUpdatedCategory);

      // Act
      await service.setCategoryHidden(categoryId, true);

      // Assert
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { isHidden: true },
      });
    });

    it('should throw ConflictException when category is already in target state', async () => {
      // Arrange
      const categoryId = 1;
      const mockCategory = {
        id: categoryId,
        name: 'Test Category',
        isHidden: true,
      };
      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);

      // Act & Assert
      await expect(service.setCategoryHidden(categoryId, true)).rejects.toThrow(
        new ConflictException('Category already hidden'),
      );
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(prismaService.category.update).not.toHaveBeenCalled();
    });
  });

  describe('addHiddenKeyword', () => {
    it('should add hidden keyword successfully when keyword does not exist', async () => {
      // Arrange
      const keyword = 'spam';
      const mockKeyword = { id: 1, keyword, created_at: new Date() };
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findFirst')
        .mockResolvedValue(null);
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'create')
        .mockResolvedValue(mockKeyword);

      // Act
      await service.addHiddenKeyword(keyword);

      // Assert
      expect(prismaService.hiddenArticleKeyword.findFirst).toHaveBeenCalledWith(
        {
          where: { keyword: { equals: keyword, mode: 'insensitive' } },
        },
      );
      expect(prismaService.hiddenArticleKeyword.create).toHaveBeenCalledWith({
        data: { keyword },
      });
    });

    it('should throw ConflictException when keyword already exists', async () => {
      // Arrange
      const keyword = 'spam';
      const existingKeyword = { id: 1, keyword, created_at: new Date() };
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findFirst')
        .mockResolvedValue(existingKeyword);

      // Act & Assert
      await expect(service.addHiddenKeyword(keyword)).rejects.toThrow(
        new ConflictException('Keyword already exists'),
      );
      expect(prismaService.hiddenArticleKeyword.findFirst).toHaveBeenCalledWith(
        {
          where: { keyword: { equals: keyword, mode: 'insensitive' } },
        },
      );
      expect(prismaService.hiddenArticleKeyword.create).not.toHaveBeenCalled();
    });
  });

  describe('removeHiddenKeyword', () => {
    it('should remove hidden keyword successfully when keyword exists', async () => {
      // Arrange
      const keywordId = 1;
      const mockKeyword = {
        id: keywordId,
        keyword: 'spam',
        created_at: new Date(),
      };
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findUnique')
        .mockResolvedValue(mockKeyword);
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'delete')
        .mockResolvedValue(mockKeyword);

      // Act
      await service.removeHiddenKeyword(keywordId);

      // Assert
      expect(
        prismaService.hiddenArticleKeyword.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: keywordId },
      });
      expect(prismaService.hiddenArticleKeyword.delete).toHaveBeenCalledWith({
        where: { id: keywordId },
      });
    });

    it('should throw NotFoundException when keyword does not exist', async () => {
      // Arrange
      const keywordId = 999;
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(service.removeHiddenKeyword(keywordId)).rejects.toThrow(
        new NotFoundException('Keyword Id not found'),
      );
      expect(
        prismaService.hiddenArticleKeyword.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: keywordId },
      });
      expect(prismaService.hiddenArticleKeyword.delete).not.toHaveBeenCalled();
    });
  });

  describe('getModerationStatus', () => {
    it('should return categories and hidden keywords successfully', async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: 'Technology', isHidden: false },
        { id: 2, name: 'Politics', isHidden: true },
      ];
      const mockHiddenKeywords = [
        { id: 1, keyword: 'test', created_at: new Date() },
      ];
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(mockCategories);
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findMany')
        .mockResolvedValue(mockHiddenKeywords);

      // Act
      const result = await service.getModerationStatus();

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(prismaService.hiddenArticleKeyword.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual({
        categories: mockCategories,
        hiddenKeywords: mockHiddenKeywords,
      });
    });

    it('should return empty arrays when no categories and keywords exist', async () => {
      // Arrange
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([]);
      jest
        .spyOn(prismaService.hiddenArticleKeyword, 'findMany')
        .mockResolvedValue([]);

      // Act
      const result = await service.getModerationStatus();

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(prismaService.hiddenArticleKeyword.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual({
        categories: [],
        hiddenKeywords: [],
      });
    });
  });
});
