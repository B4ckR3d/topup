import { Module } from '@nestjs/common'
import { DatabaseModule } from 'src/core/database/database.module'
import { ProductCategoriesController } from './product-categories.controller'
import { ProductCategoriesRepository } from './product-categories.repository'
import { ProductCategoriesService } from './product-categories.service'

@Module({
  imports: [DatabaseModule],
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService, ProductCategoriesRepository],
})
export class ProductCategoriesModule {}
