import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from 'src/modules/article/article.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
import { EmailService } from 'src/modules/email/email.service';
import { ArticleValidator } from 'src/modules/article/article.validator';
import { NotificationService } from 'src/modules/notification/notification.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

// Mock services
const mockPrismaService = {
  article: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
  userSavedArticle: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
  userArticleReaction: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  userReadArticle: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  reaction: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  userReportedArticle: {
    create: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  newsSource: {
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  userSubscribedCategory: {
    findMany: jest.fn(),
  },
  userSubscribedKeyword: {
    findMany: jest.fn(),
  },
  userNotification: {
    findUnique: jest.fn(),
  },
};

const mockNewsApiAdapter = {
  fetchArticles: jest.fn(),
};

const mockTheNewsApiAdapter = {
  fetchArticles: jest.fn(),
};

const mockEmailService = {
  sendEmail: jest.fn(),
};

const mockArticleValidator = {
  validateArticleId: jest.fn(),
  validateUserId: jest.fn(),
  isArticleCensored: jest.fn(),
};

const mockNotificationService = {
  getUserRelevantArticles: jest.fn(),
  getUserSettings: jest.fn(),
};

describe('ArticleService', () => {
  let service: ArticleService;
  let prismaService: jest.Mocked<PrismaService>;
  let newsApiAdapter: jest.Mocked<NewsApiAdapter>;
  let theNewsApiAdapter: jest.Mocked<TheNewsApiAdapter>;
  let emailService: jest.Mocked<EmailService>;
  let articleValidator: jest.Mocked<ArticleValidator>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NewsApiAdapter,
          useValue: mockNewsApiAdapter,
        },
        {
          provide: TheNewsApiAdapter,
          useValue: mockTheNewsApiAdapter,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ArticleValidator,
          useValue: mockArticleValidator,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    prismaService = module.get(PrismaService);
    newsApiAdapter = module.get(NewsApiAdapter);
    theNewsApiAdapter = module.get(TheNewsApiAdapter);
    emailService = module.get(EmailService);
    articleValidator = module.get(ArticleValidator);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return all non-hidden categories ordered by ID', async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: 'Technology', isHidden: false },
        { id: 2, name: 'Politics', isHidden: false },
        { id: 3, name: 'Hidden Category', isHidden: true },
      ];
      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(mockCategories);

      // Act
      const result = await service.getCategories();

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { isHidden: false },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array when no non-hidden categories exist', async () => {
      // Arrange
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([]);

      // Act
      const result = await service.getCategories();

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { isHidden: false },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getArticles', () => {
    it('should return articles with filters and ordering', async () => {
      // Arrange
      const userId = 1;
      const filter = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        category_id: 1,
        search: 'technology',
        orderBy: 'published_at' as const,
        orderDirection: 'desc' as const,
      };
      const mockArticles = [
        {
          id: 1,
          category_id: 1,
          isHidden: false,
          headline: 'Tech Article 1',
          description: 'desc',
          source: 'source',
          url: 'url1',
          published_at: new Date(),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
        {
          id: 2,
          category_id: 1,
          isHidden: false,
          headline: 'Tech Article 2',
          description: 'desc',
          source: 'source',
          url: 'url2',
          published_at: new Date(),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
      ];
      jest
        .spyOn(prismaService.article, 'findMany')
        .mockResolvedValue(mockArticles);

      // Act
      const result = await service.getArticles(userId, filter);

      // Assert
      expect(prismaService.article.findMany).toHaveBeenCalledWith({
        where: {
          published_at: {
            gte: filter.from,
            lte: filter.to,
          },
          category_id: filter.category_id,
          OR: [
            { headline: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          [filter.orderBy]: filter.orderDirection,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual([
        { id: 1, headline: 'Tech Article 1', description: 'desc' },
        { id: 2, headline: 'Tech Article 2', description: 'desc' },
      ]);
    });

    it('should return articles without filters when no filters provided', async () => {
      // Arrange
      const userId = 1;
      const filter = {
        orderBy: 'published_at' as const,
        orderDirection: 'desc' as const,
      };
      const mockArticlesNoFilter = [
        {
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
        {
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
      ];
      jest
        .spyOn(prismaService.article, 'findMany')
        .mockResolvedValue(mockArticlesNoFilter);

      // Act
      const result = await service.getArticles(userId, filter);

      // Assert
      expect(prismaService.article.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          [filter.orderBy]: filter.orderDirection,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual([
        { id: 1, headline: 'Article 1', description: 'desc' },
        { id: 2, headline: 'Article 2', description: 'desc' },
      ]);
    });
  });

  describe('getDetailedArticle', () => {
    it('should return detailed article with user interactions', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockArticle = {
        id: articleId,
        category_id: 1,
        isHidden: false,
        headline: 'Detailed Article',
        description: 'desc',
        source: 'source',
        url: 'url1',
        published_at: new Date(),
        created_at: new Date(),
        like_count: 0,
        dislike_count: 0,
        savedBy: [{ id: 1 }],
        reactions: [{ reaction_id: 1 }],
      };
      jest
        .spyOn(prismaService.article, 'findUnique')
        .mockResolvedValue(mockArticle);

      // Act
      const result = await service.getDetailedArticle(userId, articleId);

      // Assert
      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
        include: expect.any(Object),
      });
      expect(result).toEqual({
        id: articleId,
        headline: 'Detailed Article',
        description: 'desc',
        source: 'source',
        url: 'url1',
        published_at: mockArticle.published_at,
        category_id: 1,
        isSaved: true,
        reaction_id: 1,
      });
    });

    it('should throw NotFoundException when article does not exist', async () => {
      // Arrange
      const userId = 1;
      const articleId = 999;
      jest.spyOn(prismaService.article, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getDetailedArticle(userId, articleId),
      ).rejects.toThrow(new NotFoundException('Article not found'));
      expect(prismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: articleId },
        include: expect.any(Object),
      });
    });
  });

  describe('getSavedArticles', () => {
    it('should return user saved articles successfully', async () => {
      // Arrange
      const userId = 1;
      const mockSavedArticles = [
        {
          id: 1,
          user_id: userId,
          article_id: 1,
          article: { id: 1, headline: 'Saved Article 1' },
        },
        {
          id: 2,
          user_id: userId,
          article_id: 2,
          article: { id: 2, headline: 'Saved Article 2' },
        },
      ];
      jest
        .spyOn(prismaService.userSavedArticle, 'findMany')
        .mockResolvedValue(mockSavedArticles);
      jest
        .spyOn(articleValidator, 'isArticleCensored')
        .mockResolvedValue(false);

      // Act
      const result = await service.getSavedArticles(userId);

      // Assert
      expect(prismaService.userSavedArticle.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: expect.any(Object),
        orderBy: { id: 'desc' },
      });
      expect(result).toEqual([
        { id: 1, headline: 'Saved Article 1', description: undefined },
        { id: 2, headline: 'Saved Article 2', description: undefined },
      ]);
    });

    it('should return empty array when user has no saved articles', async () => {
      // Arrange
      const userId = 1;
      jest
        .spyOn(prismaService.userSavedArticle, 'findMany')
        .mockResolvedValue([]);
      jest.spyOn(articleValidator, 'isArticleCensored').mockResolvedValue(true);

      // Act
      const result = await service.getSavedArticles(userId);

      // Assert
      expect(prismaService.userSavedArticle.findMany).toHaveBeenCalledWith({
        where: { user_id: userId },
        include: expect.any(Object),
        orderBy: { id: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('saveArticle', () => {
    it('should save article for user successfully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockSavedArticle = {
        id: 1,
        user_id: userId,
        article_id: articleId,
      };
      jest
        .spyOn(prismaService.userSavedArticle, 'create')
        .mockResolvedValue(mockSavedArticle);

      // Act
      await service.saveArticle(userId, articleId);

      // Assert
      expect(prismaService.userSavedArticle.create).toHaveBeenCalledWith({
        data: { user_id: userId, article_id: articleId },
      });
    });

    it('should handle save article errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const saveError = new Error('Save failed');
      jest
        .spyOn(prismaService.userSavedArticle, 'create')
        .mockRejectedValue(saveError);

      // Act & Assert
      await expect(service.saveArticle(userId, articleId)).rejects.toThrow(
        'Save failed',
      );
      expect(prismaService.userSavedArticle.create).toHaveBeenCalledWith({
        data: { user_id: userId, article_id: articleId },
      });
    });
  });

  describe('unsaveArticle', () => {
    it('should unsave article for user successfully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockDeletedArticle = {
        id: 1,
        user_id: userId,
        article_id: articleId,
      };
      jest
        .spyOn(prismaService.userSavedArticle, 'deleteMany')
        .mockResolvedValue({ count: 1 });

      // Act
      await service.unsaveArticle(userId, articleId);

      // Assert
      expect(prismaService.userSavedArticle.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          article_id: articleId,
        },
      });
    });

    it('should handle unsave article errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const unsaveError = new Error('Unsave failed');
      jest
        .spyOn(prismaService.userSavedArticle, 'deleteMany')
        .mockRejectedValue(unsaveError);

      // Act & Assert
      await expect(service.unsaveArticle(userId, articleId)).rejects.toThrow(
        'Unsave failed',
      );
      expect(prismaService.userSavedArticle.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          article_id: articleId,
        },
      });
    });
  });

  describe('getReactions', () => {
    it('should return all reactions successfully', async () => {
      // Arrange
      const mockReactions = [
        { id: 1, name: 'Like', emoji: '👍' },
        { id: 2, name: 'Dislike', emoji: '👎' },
      ];
      jest
        .spyOn(prismaService.reaction, 'findMany')
        .mockResolvedValue(mockReactions);

      // Act
      const result = await service.getReactions();

      // Assert
      expect(prismaService.reaction.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      });
      expect(result).toEqual(mockReactions);
    });

    it('should return empty array when no reactions exist', async () => {
      // Arrange
      jest.spyOn(prismaService.reaction, 'findMany').mockResolvedValue([]);

      // Act
      const result = await service.getReactions();

      // Assert
      expect(prismaService.reaction.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      });
      expect(result).toEqual([]);
    });
  });

  describe('reactToArticle', () => {
    it('should add reaction to article successfully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const reactionId = 1;
      const mockReaction = {
        id: 1,
        user_id: userId,
        article_id: articleId,
        reaction_id: reactionId,
      };
      jest
        .spyOn(prismaService.userArticleReaction, 'create')
        .mockResolvedValue(mockReaction);

      // Act
      await service.reactToArticle(userId, articleId, reactionId);

      // Assert
      expect(prismaService.userArticleReaction.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          article_id: articleId,
          reaction_id: reactionId,
        },
      });
    });

    it('should handle reaction errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const reactionId = 1;
      const reactionError = new Error('Reaction failed');
      jest
        .spyOn(prismaService.userArticleReaction, 'create')
        .mockRejectedValue(reactionError);

      // Act & Assert
      await expect(
        service.reactToArticle(userId, articleId, reactionId),
      ).rejects.toThrow('Reaction failed');
      expect(prismaService.userArticleReaction.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          article_id: articleId,
          reaction_id: reactionId,
        },
      });
    });
  });

  describe('removeReaction', () => {
    it('should remove reaction from article successfully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockExistingReaction = {
        id: 1,
        user_id: userId,
        article_id: articleId,
        reaction_id: 1,
      };
      const mockReaction = { id: 1, name: 'like' };
      jest
        .spyOn(prismaService.userArticleReaction, 'findFirst')
        .mockResolvedValue(mockExistingReaction);
      jest
        .spyOn(prismaService.reaction, 'findFirst')
        .mockResolvedValue(mockReaction);
      jest.spyOn(prismaService.article, 'update').mockResolvedValue({} as any);
      jest
        .spyOn(prismaService.userArticleReaction, 'delete')
        .mockResolvedValue(mockExistingReaction);

      // Act
      await service.removeReaction(userId, articleId);

      // Assert
      expect(prismaService.userArticleReaction.findFirst).toHaveBeenCalledWith({
        where: { user_id: userId, article_id: articleId },
      });
      expect(prismaService.reaction.findFirst).toHaveBeenCalledWith({
        where: { id: mockExistingReaction.reaction_id },
      });
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: articleId },
        data: { like_count: { decrement: 1 } },
      });
      expect(prismaService.userArticleReaction.delete).toHaveBeenCalledWith({
        where: { id: mockExistingReaction.id },
      });
    });

    it('should handle remove reaction errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockExistingReaction = {
        id: 1,
        user_id: userId,
        article_id: articleId,
        reaction_id: 1,
      };
      const removeError = new Error('Remove reaction failed');
      jest
        .spyOn(prismaService.userArticleReaction, 'findFirst')
        .mockResolvedValue(mockExistingReaction);
      jest
        .spyOn(prismaService.userArticleReaction, 'delete')
        .mockRejectedValue(removeError);

      // Act & Assert
      await expect(service.removeReaction(userId, articleId)).rejects.toThrow(
        'Remove reaction failed',
      );
      expect(prismaService.userArticleReaction.findFirst).toHaveBeenCalledWith({
        where: { user_id: userId, article_id: articleId },
      });
      expect(prismaService.userArticleReaction.delete).toHaveBeenCalledWith({
        where: { id: mockExistingReaction.id },
      });
    });
  });

  describe('reportArticle', () => {
    it('should report article successfully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const mockReport = {
        id: 1,
        user_id: userId,
        article_id: articleId,
        created_at: new Date(),
      };
      jest
        .spyOn(prismaService.userReportedArticle, 'create')
        .mockResolvedValue(mockReport);

      // Act
      await service.reportArticle(userId, articleId);

      // Assert
      expect(prismaService.userReportedArticle.create).toHaveBeenCalledWith({
        data: { user_id: userId, article_id: articleId },
      });
    });

    it('should handle report article errors gracefully', async () => {
      // Arrange
      const userId = 1;
      const articleId = 1;
      const reportError = new Error('Report failed');
      jest
        .spyOn(prismaService.userReportedArticle, 'create')
        .mockRejectedValue(reportError);

      // Act & Assert
      await expect(service.reportArticle(userId, articleId)).rejects.toThrow(
        'Report failed',
      );
      expect(prismaService.userReportedArticle.create).toHaveBeenCalledWith({
        data: { user_id: userId, article_id: articleId },
      });
    });
  });

  describe('getRecommendations', () => {
    it('should return article recommendations based on user history', async () => {
      // Arrange
      const userId = 1;
      const mockUserReactions = [
        {
          id: 1,
          user_id: userId,
          article_id: 1,
          reaction_id: 1,
          article: { category_id: 1 },
        },
        {
          id: 2,
          user_id: userId,
          article_id: 2,
          reaction_id: 2,
          article: { category_id: 2 },
        },
      ];
      const mockRecommendedArticles = [
        {
          id: 1,
          category_id: 1,
          isHidden: false,
          headline: 'Recommended Article 1',
          description: 'desc',
          source: 'source',
          url: 'url1',
          published_at: new Date(),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
        {
          id: 2,
          category_id: 2,
          isHidden: false,
          headline: 'Recommended Article 2',
          description: 'desc',
          source: 'source',
          url: 'url2',
          published_at: new Date(),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
      ];
      jest
        .spyOn(prismaService.userArticleReaction, 'findMany')
        .mockResolvedValue(mockUserReactions);
      jest
        .spyOn(prismaService.userReadArticle, 'findMany')
        .mockResolvedValue([]);
      jest
        .spyOn(prismaService.article, 'findMany')
        .mockResolvedValue(mockRecommendedArticles);
      jest.spyOn(notificationService, 'getUserSettings').mockResolvedValue({});
      jest
        .spyOn(articleValidator, 'isArticleCensored')
        .mockResolvedValue(false);

      // Act
      const result = await service.getRecommendations(userId);

      // Assert
      expect(prismaService.userArticleReaction.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, reaction: { name: 'like' } },
        include: { article: true },
      });
      expect(result).toEqual(mockRecommendedArticles);
    });

    it('should return empty array when user has no reaction history', async () => {
      // Arrange
      const userId = 1;
      jest
        .spyOn(prismaService.userArticleReaction, 'findMany')
        .mockResolvedValue([]);
      jest
        .spyOn(prismaService.userReadArticle, 'findMany')
        .mockResolvedValue([]);
      jest.spyOn(prismaService.article, 'findMany').mockResolvedValue([]);
      jest.spyOn(notificationService, 'getUserSettings').mockResolvedValue({});

      // Act
      const result = await service.getRecommendations(userId);

      // Assert
      expect(prismaService.userArticleReaction.findMany).toHaveBeenCalledWith({
        where: { user_id: userId, reaction: { name: 'like' } },
        include: { article: true },
      });
      expect(result).toEqual([]);
    });
  });
});
