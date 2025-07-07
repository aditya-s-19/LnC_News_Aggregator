import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

// Mock services
const mockUserService = {
  createUser: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockPrismaService = {
  userNotification: {
    create: jest.fn(),
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully and create notification settings', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'Test User',
        passwordHash: 'hashedpassword',
        role: 'USER',
      };
      const mockNotification = {
        id: 1,
        user_id: 1,
        last_notifications_viewed_at: expect.any(Date),
      };

      jest.spyOn(userService, 'createUser').mockResolvedValue(mockUser);
      jest
        .spyOn(prismaService.userNotification, 'create')
        .mockResolvedValue(mockNotification);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(prismaService.userNotification.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          last_notifications_viewed_at: expect.any(Date),
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should handle user creation errors during registration', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const creationError = new Error('User creation failed');

      jest.spyOn(userService, 'createUser').mockRejectedValue(creationError);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'User creation failed',
      );
      expect(userService.createUser).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      expect(prismaService.userNotification.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should generate JWT token and return login response successfully', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'Test User',
        role: 'USER',
      };
      const mockToken = 'jwt-token-123';
      const expectedPayload = {
        email: mockUser.email,
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      };
      const expectedResponse = {
        accessToken: mockToken,
        username: mockUser.username,
        role: mockUser.role,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      // Act
      const result = await service.login(mockUser);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle JWT signing errors during login', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'Test User',
        role: 'USER',
      };
      const signingError = new Error('JWT signing failed');

      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw signingError;
      });

      // Act & Assert
      await expect(service.login(mockUser)).rejects.toThrow(
        'JWT signing failed',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        username: mockUser.username,
        role: mockUser.role,
      });
    });
  });
});
