import { Module } from '@nestjs/common';
import { NotifcationConfigService } from './notification-config.service';

@Module({
  providers: [NotifcationConfigService],
})
export class NotificationConfigModule {}
