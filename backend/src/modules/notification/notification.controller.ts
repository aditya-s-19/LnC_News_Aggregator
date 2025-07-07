import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { NotificationValidator } from './notification.validator';
import { jwtPayload } from 'src/utils/types/jwt-payload';
import { AuthValidator } from '../auth/auth.validator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user')
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly authValidator: AuthValidator,
    private readonly notificationService: NotificationService,
    private readonly notificationValidator: NotificationValidator,
  ) {}

  @Get()
  async getUserNotifications(@Req() req: { user: jwtPayload }) {
    await this.authValidator.userIdShouldExist(req.user.userId);
    return await this.notificationService.getUserRelevantArticles(
      req.user.userId,
    );
  }

  @Get('settings')
  async getUserNotificationSettings(@Req() req: { user: jwtPayload }) {
    await this.authValidator.userIdShouldExist(req.user.userId);
    return await this.notificationService.getUserSettings(req.user.userId);
  }

  @Put('settings')
  async updateUserNotificationSettings(
    @Req() req: { user: jwtPayload },
    @Body()
    body: {
      [categoryName: string]: {
        id: number;
        isEnabled: boolean;
        keywords: string[];
      };
    },
  ) {
    await this.authValidator.userIdShouldExist(req.user.userId);
    await this.notificationValidator.validateSettingsPayload(body);
    return await this.notificationService.updateAllUserSettings(
      req.user.userId,
      body,
    );
  }
}
