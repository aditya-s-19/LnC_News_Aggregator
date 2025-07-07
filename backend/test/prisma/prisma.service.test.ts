import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  userNotification: {
    deleteMany: jest.fn(),
  },
  userArticleReaction: {
    deleteMany: jest.fn(),
  },
  userSavedArticle: {
    deleteMany: jest.fn(),
  },
  userSubscribedKeyword: {
    deleteMany: jest.fn(),
  },
  userSubscribedCategory: {
    deleteMany: jest.fn(),
  },
  article: {
    deleteMany: jest.fn(),
  },
  reaction: {
    deleteMany: jest.fn(),
  },
  category: {
    deleteMany: jest.fn(),
  },
  newsSource: {
    deleteMany: jest.fn(),
  },
  user: {
    deleteMany: jest.fn(),
  },
};

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    // Mock the methods that are inherited from PrismaClient
    Object.assign(service, mockPrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to database and log success message', async () => {
      // Arrange
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.onModuleInit();

      // Assert
      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Prisma connected');
    });

    it('should handle connection errors gracefully', async () => {
      // Arrange
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(connectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database and log success message', async () => {
      // Arrange
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await service.onModuleDestroy();

      // Assert
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('🛑 Prisma disconnected');
    });

    it('should handle disconnection errors gracefully', async () => {
      // Arrange
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockRejectedValue(new Error('Disconnection failed'));

      // Act & Assert
      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnection failed',
      );
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanDatabase', () => {
    it('should execute transaction to clean all database tables', async () => {
      // Arrange
      const transactionSpy = jest
        .spyOn(service, '$transaction')
        .mockResolvedValue([]);
      const userNotificationSpy = jest
        .spyOn(service.userNotification, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userArticleReactionSpy = jest
        .spyOn(service.userArticleReaction, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userSavedArticleSpy = jest
        .spyOn(service.userSavedArticle, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userSubscribedKeywordSpy = jest
        .spyOn(service.userSubscribedKeyword, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userSubscribedCategorySpy = jest
        .spyOn(service.userSubscribedCategory, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const articleSpy = jest
        .spyOn(service.article, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const reactionSpy = jest
        .spyOn(service.reaction, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const categorySpy = jest
        .spyOn(service.category, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const newsSourceSpy = jest
        .spyOn(service.newsSource, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      const userSpy = jest
        .spyOn(service.user, 'deleteMany')
        .mockResolvedValue({ count: 0 });

      // Act
      await service.cleanDatabase();

      // Assert
      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(userNotificationSpy).toHaveBeenCalledTimes(1);
      expect(userArticleReactionSpy).toHaveBeenCalledTimes(1);
      expect(userSavedArticleSpy).toHaveBeenCalledTimes(1);
      expect(userSubscribedKeywordSpy).toHaveBeenCalledTimes(1);
      expect(userSubscribedCategorySpy).toHaveBeenCalledTimes(1);
      expect(articleSpy).toHaveBeenCalledTimes(1);
      expect(reactionSpy).toHaveBeenCalledTimes(1);
      expect(categorySpy).toHaveBeenCalledTimes(1);
      expect(newsSourceSpy).toHaveBeenCalledTimes(1);
      expect(userSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle transaction errors during database cleanup', async () => {
      // Arrange
      const transactionSpy = jest
        .spyOn(service, '$transaction')
        .mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(service.cleanDatabase()).rejects.toThrow(
        'Transaction failed',
      );
      expect(transactionSpy).toHaveBeenCalledTimes(1);
    });
  });
});
