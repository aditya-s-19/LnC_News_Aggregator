import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationValidator {
  constructor(private prisma: PrismaService) {}

  async validateSettingsPayload(settings: {
    [categoryName: string]: {
      id: number;
      isEnabled: boolean;
      keywords: string[];
    };
  }) {
    if (typeof settings !== 'object' || settings === null) {
      throw new BadRequestException('Invalid request body format.');
    }

    const allCategories = await this.prisma.category.findMany();
    const nameToIdMap = new Map(allCategories.map((c) => [c.name, c.id]));

    for (const [name, data] of Object.entries(settings)) {
      if (!nameToIdMap.has(name)) {
        throw new NotFoundException(`Category "${name}" not found`);
      }

      const expectedId = nameToIdMap.get(name);
      if (expectedId !== data.id) {
        throw new BadRequestException(
          `ID mismatch for category "${name}" (expected ${expectedId}, got ${data.id})`,
        );
      }

      if (typeof data.isEnabled !== 'boolean') {
        throw new BadRequestException(
          `Invalid isEnabled for category "${name}"`,
        );
      }

      if (!Array.isArray(data.keywords)) {
        throw new BadRequestException(
          `Keywords must be an array for category "${name}"`,
        );
      }

      for (const keyword of data.keywords) {
        if (typeof keyword !== 'string' || keyword.trim().length === 0) {
          throw new BadRequestException(
            `Each keyword in category "${name}" must be a non-empty string`,
          );
        }
      }
    }
  }
}
