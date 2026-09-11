import type { HttpContext } from '@adonisjs/core/http'
import { eq } from '@umbreon/db'
import { tb } from '@umbreon/db/types'
import vine from '@vinejs/vine'
import { db } from '#database/db'
import {
  createProductSubCategoryValidator,
  productIdValidator,
  updateProductSubCategoryValidator,
} from '#validators/product'

export default class ProductSubCategoriesController {
  public async postCreate(ctx: HttpContext) {
    const rawBody = ctx.request.body()
    if (rawBody.image_id === '') {
      delete rawBody.image_id
    }

    const { image_id: imageId, ...data } = await ctx.request.validateUsing(
      vine.compile(createProductSubCategoryValidator),
      {
        data: rawBody,
      },
    )

    let imageUrl = ''

    if (imageId) {
      const image = await db.query.fileManager.findFirst({
        where: eq(tb.fileManager.id, imageId),
      })
      if (image) {
        imageUrl = image.url
      }
    }

    // Auto-inherit parent category image if not uploaded
    if (!imageUrl && data.product_category_id) {
      const parentCategory = await db.query.productCategories.findFirst({
        where: eq(tb.productCategories.id, data.product_category_id),
      })
      if (parentCategory) {
        imageUrl = parentCategory.image_url
      }
    }

    if (!imageUrl) {
      imageUrl = '/images/default-product.png'
    }

    await db.insert(tb.productSubCategories).values({
      image_url: imageUrl,
      ...data,
    })

    ctx.session.flash('success', 'Product sub-category created successfully.')
    return ctx.response.redirect().back()
  }

  public async postUpdate(ctx: HttpContext) {
    const { id } = await ctx.request.validateUsing(vine.compile(productIdValidator), {
      data: ctx.request.params(),
    })

    const rawBody = ctx.request.body()
    if (rawBody.image_id === '') {
      delete rawBody.image_id
    }

    const data = await ctx.request.validateUsing(vine.compile(updateProductSubCategoryValidator), {
      data: rawBody,
    })

    const productSubCategory = await db.query.productSubCategories.findFirst({
      where: eq(tb.productSubCategories.id, id),
    })

    if (!productSubCategory) {
      ctx.session.flashErrors({
        error: 'Product sub-category not found',
      })
      return ctx.response.redirect().back()
    }

    let imageUrl: string | undefined

    if (data.image_id) {
      const image = await db.query.fileManager.findFirst({
        where: eq(tb.fileManager.id, data.image_id),
      })

      if (image) {
        imageUrl = image.url
      }
    }

    const updatedData: Partial<typeof productSubCategory> = {
      name: data.name ?? productSubCategory.name,
      sub_name: data.sub_name ?? productSubCategory.sub_name,
      is_available: data.is_available ?? productSubCategory.is_available,
      is_featured: data.is_featured ?? productSubCategory.is_featured,
      label: data.label ?? productSubCategory.label,
      description: data.description ?? productSubCategory.description,
      image_url: imageUrl ?? productSubCategory.image_url,
    }

    await db
      .update(tb.productSubCategories)
      .set(updatedData)
      .where(eq(tb.productSubCategories.id, id))

    ctx.session.flash('success', 'Product sub-category updated successfully.')
    return ctx.response.redirect().back()
  }

  public async postDelete(ctx: HttpContext) {
    const { id } = await ctx.request.validateUsing(vine.compile(productIdValidator), {
      data: ctx.request.params(),
    })

    const productSubCategory = await db.query.productSubCategories.findFirst({
      where: eq(tb.productSubCategories.id, id),
    })

    if (!productSubCategory) {
      ctx.session.flashErrors({
        error: 'Product sub-category not found',
      })
      return ctx.response.redirect().back()
    }

    try {
      await db.transaction(async (tx) => {
        await tx.delete(tb.products).where(eq(tb.products.product_sub_category_id, id))
        await tx.delete(tb.productSubCategories).where(eq(tb.productSubCategories.id, id))
      })
    } catch (err: any) {
      ctx.session.flashErrors({
        error: err?.message || 'Failed to delete product sub-category',
      })
      return ctx.response.redirect().back()
    }

    ctx.session.flash('success', 'Product sub-category deleted successfully.')
    return ctx.response.redirect().back()
  }

  public async detail(ctx: HttpContext) {
    const { id } = await ctx.request.validateUsing(vine.compile(productIdValidator), {
      data: ctx.request.params(),
    })

    const productSubCategory = await db.query.productSubCategories.findFirst({
      where: eq(tb.productSubCategories.id, id),
    })

    if (!productSubCategory) {
      return ctx.response.status(404).json({
        error: 'Product sub-category not found',
      })
    }

    const image = productSubCategory.image_url
      ? await db.query.fileManager.findFirst({
          where: eq(tb.fileManager.url, productSubCategory.image_url),
        })
      : null

    return ctx.response.json({
      data: {
        ...productSubCategory,
        image_id: image?.id,
      },
    })
  }
}
