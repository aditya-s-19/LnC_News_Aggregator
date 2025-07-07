import { Test, TestingModule } from '@nestjs/testing';
import { NewsApiAdapter } from 'src/adapters/news-api.adapter';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock PrismaService
const mockPrismaService = {
  newsSource: {
    findFirst: jest.fn(),
  },
};

describe('NewsApiAdapter', () => {
  let adapter: NewsApiAdapter;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsApiAdapter,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    adapter = module.get<NewsApiAdapter>(NewsApiAdapter);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchArticles', () => {
    it('should fetch articles successfully when API key is available', async () => {
      // Arrange
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-02');
      const mockNewsSource = {
        id: 1,
        name: 'NewsAPI',
        api_key: 'test-api-key',
        url: 'https://newsapi.org',
        status: 'Active',
        last_accessed: new Date(),
      };
      const mockApiResponse = {
        data: {
          articles: [
            {
              title: 'Test Article 1',
              description: 'Test description 1',
              source: { name: 'Test Source 1' },
              url: 'https://test1.com',
              publishedAt: '2024-01-01T10:00:00Z',
            },
            {
              title: 'Test Article 2',
              description: 'Test description 2',
              source: { name: 'Test Source 2' },
              url: 'https://test2.com',
              publishedAt: '2024-01-01T11:00:00Z',
            },
          ],
        },
      };

      jest
        .spyOn(prismaService.newsSource, 'findFirst')
        .mockResolvedValue(mockNewsSource);
      mockedAxios.get.mockResolvedValue(mockApiResponse);

      // Act
      const result = await adapter.fetchArticles(from, to);

      // Assert
      expect(prismaService.newsSource.findFirst).toHaveBeenCalledWith({
        where: { name: 'NewsAPI' },
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://newsapi.org/v2/everything',
        {
          params: {
            apiKey: 'test-api-key',
            domains: expect.any(String),
            from: from.toISOString(),
            to: to.toISOString(),
            language: 'en',
            page: 1,
          },
        },
      );
      expect(result).toEqual([
        {
          title: 'Test Article 1',
          description: 'Test description 1',
          source: 'Test Source 1',
          url: 'https://test1.com',
          publishedAt: '2024-01-01T10:00:00Z',
          categories: [],
        },
        {
          title: 'Test Article 2',
          description: 'Test description 2',
          source: 'Test Source 2',
          url: 'https://test2.com',
          publishedAt: '2024-01-01T11:00:00Z',
          categories: [],
        },
      ]);
    });

    it('should return empty array when API key is missing', async () => {
      // Arrange
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-02');

      jest.spyOn(prismaService.newsSource, 'findFirst').mockResolvedValue(null);

      // Act
      const result = await adapter.fetchArticles(from, to);

      // Assert
      expect(prismaService.newsSource.findFirst).toHaveBeenCalledWith({
        where: { name: 'NewsAPI' },
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
