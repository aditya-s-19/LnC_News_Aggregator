import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from 'src/modules/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleService } from 'src/modules/article/article.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock PrismaService
const mockPrismaService = {
  userNotification: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  userSubscribedCategory: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  userSubscribedKeyword: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  article: {
    findMany: jest.fn(),
  },
};

// Mock ArticleService
const mockArticleService = {
  filterOutCensoredArticles: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: jest.Mocked<PrismaService>;
  let articleService: jest.Mocked<ArticleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ArticleService,
          useValue: mockArticleService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get(PrismaService);
    articleService = module.get(ArticleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRelevantArticles', () => {
    it('should return relevant articles for user with subscriptions', async () => {
      // Arrange
      const userId = 1;
      const mockUserNotification = {
        id: 1,
        user_id: userId,
        last_notifications_viewed_at: new Date('2024-01-01'),
      };
      const mockSubscribedCategories = [
        { id: 1, user_id: userId, category_id: 1 },
        { id: 2, user_id: userId, category_id: 2 },
      ];
      const mockKeywords = [
        { id: 1, user_id: userId, category_id: 1, keyword: 'technology' },
        { id: 2, user_id: userId, category_id: 2, keyword: 'politics' },
      ];
      const mockArticles = [
        {
          id: 1,
          category_id: 1,
          isHidden: false,
          headline: 'Tech Article',
          description: 'desc',
          source: 'source',
          url: 'url1',
          published_at: new Date('2024-01-02'),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
        {
          id: 2,
          category_id: 2,
          isHidden: false,
          headline: 'Politics Article',
          description: 'desc',
          source: 'source',
          url: 'url2',
          published_at: new Date('2024-01-02'),
          created_at: new Date(),
          like_count: 0,
          dislike_count: 0,
        },
      ];
      const mockVisibleArticles = [{ id: 1 }, { id: 2 }];

      jest
        .spyOn(prismaService.userNotification, 'findUnique')
        .mockResolvedValue(mockUserNotification);
      jest
        .spyOn(prismaService.userSubscribedCategory, 'findMany')
        .mockResolvedValue(mockSubscribedCategories);
      jest
        .spyOn(prismaService.userSubscribedKeyword, 'findMany')
        .mockResolvedValue(mockKeywords);
      jest
        .spyOn(prismaService.article, 'findMany')
        .mockResolvedValue(mockArticles);
      jest
        .spyOn(articleService, 'filterOutCensoredArticles')
        .mockResolvedValue(mockVisibleArticles);
      jest
        .spyOn(prismaService.userNotification, 'update')
        .mockResolvedValue(mockUserNotification);

      // Act
      const result = await service.getUserRelevantArticles(userId);

      // Assert
      expect(prismaService.userNotification.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(
        prismaService.userSubscribedCategory.findMany,
      ).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(prismaService.userSubscribedKeyword.findMany).toHaveBeenCalledWith(
        {
          where: { user_id: userId },
        },
      );
      expect(prismaService.article.findMany).toHaveBeenCalledWith({
        where: {
          published_at: {
            gt: mockUserNotification.last_notifications_viewed_at,
          },
          OR: expect.any(Array),
        },
        orderBy: { published_at: 'desc' },
      });
      expect(articleService.filterOutCensoredArticles).toHaveBeenCalledWith(
        userId,
        mockArticles.map((a) => ({ id: a.id })),
      );
      expect(result).toEqual(mockArticles);
    });

    it('should return empty array when user has no subscribed categories', async () => {
      // Arrange
      const userId = 1;
      const mockUserNotification = {
        id: 1,
        user_id: userId,
        last_notifications_viewed_at: new Date('2024-01-01'),
      };

      jest
        .spyOn(prismaService.userNotification, 'findUnique')
        .mockResolvedValue(mockUserNotification);
      jest
        .spyOn(prismaService.userSubscribedCategory, 'findMany')
        .mockResolvedValue([]);

      // Act
      const result = await service.getUserRelevantArticles(userId);

      // Assert
      expect(prismaService.userNotification.findUnique).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(
        prismaService.userSubscribedCategory.findMany,
      ).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings with categories and keywords', async () => {
      // Arrange
      const userId = 1;
      const mockCategories = [
        { id: 1, name: 'Technology', isHidden: false },
        { id: 2, name: 'Politics', isHidden: false },
      ];
      const mockSubscribed = [{ id: 1, user_id: userId, category_id: 1 }];
      const mockKeywordsSettings = [
        { id: 1, user_id: userId, category_id: 1, keyword: 'AI' },
        { id: 2, user_id: userId, category_id: 1, keyword: 'Machine Learning' },
      ];

      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(mockCategories);
      jest
        .spyOn(prismaService.userSubscribedCategory, 'findMany')
        .mockResolvedValue(mockSubscribed);
      jest
        .spyOn(prismaService.userSubscribedKeyword, 'findMany')
        .mockResolvedValue(mockKeywordsSettings);

      // Act
      const result = await service.getUserSettings(userId);

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { isHidden: false },
        orderBy: { id: 'asc' },
      });
      expect(
        prismaService.userSubscribedCategory.findMany,
      ).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(prismaService.userSubscribedKeyword.findMany).toHaveBeenCalledWith(
        {
          where: { user_id: userId },
        },
      );
      expect(result).toEqual({
        Technology: {
          id: 1,
          isEnabled: true,
          keywords: ['AI', 'Machine Learning'],
        },
        Politics: {
          id: 2,
          isEnabled: false,
          keywords: [],
        },
      });
    });

    it('should return empty settings when no categories exist', async () => {
      // Arrange
      const userId = 1;
      jest.spyOn(prismaService.category, 'findMany').mockResolvedValue([]);
      jest
        .spyOn(prismaService.userSubscribedCategory, 'findMany')
        .mockResolvedValue([]);
      jest
        .spyOn(prismaService.userSubscribedKeyword, 'findMany')
        .mockResolvedValue([]);

      // Act
      const result = await service.getUserSettings(userId);

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: { isHidden: false },
        orderBy: { id: 'asc' },
      });
      expect(result).toEqual({});
    });
  });

  describe('updateUserCategories', () => {
    it('should update user categories successfully with valid category IDs', async () => {
      // Arrange
      const userId = 1;
      const categoryIds = [1, 2];
      const mockCategories = [
        { id: 1, name: 'Technology', isHidden: false },
        { id: 2, name: 'Politics', isHidden: false },
      ];

      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(mockCategories);
      jest
        .spyOn(prismaService.userSubscribedCategory, 'deleteMany')
        .mockResolvedValue({ count: 2 });
      jest
        .spyOn(prismaService.userSubscribedCategory, 'createMany')
        .mockResolvedValue({ count: 2 });

      // Act
      await service.updateUserCategories(userId, categoryIds);

      // Assert
      expect(prismaService.category.findMany).toHaveBeenCalledWith();
      expect(
        prismaService.userSubscribedCategory.deleteMany,
      ).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(
        prismaService.userSubscribedCategory.createMany,
      ).toHaveBeenCalledWith({
        data: categoryIds.map((id) => ({ user_id: userId, category_id: id })),
      });
    });

    it('should throw BadRequestException when invalid category ID is provided', async () => {
      // Arrange
      const userId = 1;
      const categoryIds = [1, 999];
      const mockCategories = [{ id: 1, name: 'Technology', isHidden: false }];

      jest
        .spyOn(prismaService.category, 'findMany')
        .mockResolvedValue(mockCategories);

      // Act & Assert
      await expect(
        service.updateUserCategories(userId, categoryIds),
      ).rejects.toThrow(new BadRequestException('Invalid category ID: 999'));
      expect(prismaService.category.findMany).toHaveBeenCalledWith();
      expect(
        prismaService.userSubscribedCategory.deleteMany,
      ).not.toHaveBeenCalled();
      expect(
        prismaService.userSubscribedCategory.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateUserKeywords', () => {
    it('should update user keywords successfully for valid category', async () => {
      // Arrange
      const userId = 1;
      const categoryId = 1;
      const keywords = ['AI', 'Machine Learning'];
      const mockCategory = {
        id: categoryId,
        name: 'Technology',
        isHidden: false,
      };

      jest
        .spyOn(prismaService.category, 'findUnique')
        .mockResolvedValue(mockCategory);
      jest
        .spyOn(prismaService.userSubscribedKeyword, 'deleteMany')
        .mockResolvedValue({ count: 2 });
      jest
        .spyOn(prismaService.userSubscribedKeyword, 'createMany')
        .mockResolvedValue({ count: 2 });

      // Act
      await service.updateUserKeywords(userId, categoryId, keywords);

      // Assert
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(
        prismaService.userSubscribedKeyword.deleteMany,
      ).toHaveBeenCalledWith({
        where: { user_id: userId, category_id: categoryId },
      });
      expect(
        prismaService.userSubscribedKeyword.createMany,
      ).toHaveBeenCalledWith({
        data: keywords.map((keyword) => ({
          user_id: userId,
          category_id: categoryId,
          keyword,
        })),
        skipDuplicates: true,
      });
    });

    it('should throw BadRequestException when invalid category ID is provided', async () => {
      // Arrange
      const userId = 1;
      const categoryId = 999;
      const keywords = ['AI', 'Machine Learning'];

      jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateUserKeywords(userId, categoryId, keywords),
      ).rejects.toThrow(new BadRequestException('Invalid category ID: 999'));
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(
        prismaService.userSubscribedKeyword.deleteMany,
      ).not.toHaveBeenCalled();
      expect(
        prismaService.userSubscribedKeyword.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateAllUserSettings', () => {
    it('should update all user settings successfully', async () => {
      // Arrange
      const userId = 1;
      const settings = {
        Technology: { id: 1, isEnabled: true, keywords: ['AI'] },
        Politics: { id: 2, isEnabled: false, keywords: [] },
      };

      jest.spyOn(service, 'updateUserCategories').mockResolvedValue();
      jest.spyOn(service, 'updateUserKeywords').mockResolvedValue();

      // Act
      await service.updateAllUserSettings(userId, settings);

      // Assert
      expect(service.updateUserCategories).toHaveBeenCalledWith(userId, [1]);
      expect(service.updateUserKeywords).toHaveBeenCalledWith(userId, 1, [
        'AI',
      ]);
      expect(service.updateUserKeywords).toHaveBeenCalledWith(userId, 2, []);
    });

    it('should handle empty settings gracefully', async () => {
      // Arrange
      const userId = 1;
      const settings = {};

      jest.spyOn(service, 'updateUserCategories').mockResolvedValue();
      jest.spyOn(service, 'updateUserKeywords').mockResolvedValue();

      // Act
      await service.updateAllUserSettings(userId, settings);

      // Assert
      expect(service.updateUserCategories).toHaveBeenCalledWith(userId, []);
      expect(service.updateUserKeywords).not.toHaveBeenCalled();
    });
  });
});
