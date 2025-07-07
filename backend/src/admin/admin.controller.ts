import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminValidator } from './admin.validator';
import { UpdateSourceRequestDto } from './dtos/update-source-request.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminValidator: AdminValidator,
  ) {}

  @Get('sources')
  async getSources() {
    return this.adminService.getSources();
  }

  @Put('source/:id')
  async updateSource(
    @Param('id') id: string,
    @Body() dto: UpdateSourceRequestDto,
  ) {
    await this.adminValidator.sourceShouldExist(+id);
    return this.adminService.updateSource(+id, dto);
  }

  @Post('category/add/:name')
  async addCategory(@Param('name') name: string) {
    await this.adminValidator.categoryShouldNotExist(name);
    return this.adminService.addCategory(name);
  }
}
