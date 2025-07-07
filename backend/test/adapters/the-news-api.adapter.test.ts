import { Test, TestingModule } from '@nestjs/testing';
import { TheNewsApiAdapter } from 'src/adapters/the-news-api.adapter';
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

describe('TheNewsApiAdapter', () => {
  let adapter: TheNewsApiAdapter;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TheNewsApiAdapter,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    adapter = module.get<TheNewsApiAdapter>(TheNewsApiAdapter);
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
        name: 'TheNewsAPI',
        api_key: 'test-api-token',
        url: 'https://api.thenewsapi.com',
        status: 'Active',
        last_accessed: new Date(),
      };
      const mockApiResponse = {
        data: {
          data: [
            {
              title: 'Test Article 1',
              description: 'Test description 1',
              source: 'Test Source 1',
              url: 'https://test1.com',
              published_at: '2024-01-01T10:00:00Z',
              categories: ['technology', 'business'],
            },
            {
              title: 'Test Article 2',
              description: 'Test description 2',
              source: 'Test Source 2',
              url: 'https://test2.com',
              published_at: '2024-01-01T11:00:00Z',
              categories: ['politics'],
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
        where: { name: 'TheNewsAPI' },
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.thenewsapi.com/v1/news/all',
        {
          params: {
            api_token: 'test-api-token',
            published_after: '2024-01-01T00:00:00',
            published_before: '2024-01-02T00:00:00',
            language: 'en',
            limit: 3,
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
          categories: ['technology', 'business'],
        },
        {
          title: 'Test Article 2',
          description: 'Test description 2',
          source: 'Test Source 2',
          url: 'https://test2.com',
          publishedAt: '2024-01-01T11:00:00Z',
          categories: ['politics'],
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
        where: { name: 'TheNewsAPI' },
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
