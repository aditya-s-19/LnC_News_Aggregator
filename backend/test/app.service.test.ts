import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../src/app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World!" when called', () => {
      // Arrange
      const expectedResult = 'Hello World!';

      // Act
      const result = service.getHello();

      // Assert
      expect(result).toBe(expectedResult);
    });

    it('should always return the same string regardless of how many times it is called', () => {
      // Arrange
      const expectedResult = 'Hello World!';

      // Act
      const firstCall = service.getHello();
      const secondCall = service.getHello();
      const thirdCall = service.getHello();

      // Assert
      expect(firstCall).toBe(expectedResult);
      expect(secondCall).toBe(expectedResult);
      expect(thirdCall).toBe(expectedResult);
      expect(firstCall).toBe(secondCall);
      expect(secondCall).toBe(thirdCall);
    });
  });
});
