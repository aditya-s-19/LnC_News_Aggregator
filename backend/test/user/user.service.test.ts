import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user when user exists with given email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        role: 'USER',
      };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user does not exist with given email', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await service.findByEmail(email);

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password successfully', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';
      const hashedPassword = 'hashedpassword123';
      const mockCreatedUser = {
        id: 2,
        email,
        username: name,
        passwordHash: hashedPassword,
        role: 'USER',
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.createUser(email, password, name);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email, passwordHash: hashedPassword, username: name },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should handle password hashing errors during user creation', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';
      const hashingError = new Error('Hashing failed');

      jest.spyOn(bcrypt, 'hash').mockRejectedValue(hashingError as never);

      // Act & Assert
      await expect(service.createUser(email, password, name)).rejects.toThrow(
        'Hashing failed',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
