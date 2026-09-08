import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/auth.types';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type AuthenticatedRequest = Request & { user: AuthUser };

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('categories')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query() query: CategoryQueryDto, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.findAll(query.includeArchived, request.user);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() body: CreateCategoryDto, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.create(body, request.user);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.update(id, body, request.user);
  }

  @Post(':id/archive')
  @Roles('ADMIN')
  archive(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.setActive(id, false, request.user);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  restore(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.categoriesService.setActive(id, true, request.user);
  }
}
