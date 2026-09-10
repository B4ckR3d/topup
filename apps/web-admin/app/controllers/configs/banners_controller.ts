import type { HttpContext } from '@adonisjs/core/http'
import { eq } from '@umbreon/db'
import { tb } from '@umbreon/db/types'
import vine from '@vinejs/vine'
import { db } from '#database/db'
import { createBannerValidator } from '#validators/banners'
export default class BannersController {
  async index(ctx: HttpContext) {
    const banners = await db.query.banners.findMany({
      orderBy: (bannersTable, { desc }) => [desc(bannersTable.created_at)],
    })

    return ctx.inertia.render('configs/banners/index', {
      banners,
    })
  }

  async postCreate(ctx: HttpContext) {
    const raw = ctx.request.body()
    for (const key of ['description', 'product_category_id', 'href_url', 'app_url']) {
      if (typeof raw[key] === 'string' && raw[key].trim() === '') {
        raw[key] = null
      }
    }

    const {
      title,
      image_id: imageId,
      description,
      is_available: isAvailable,
      product_category_id: productCategoryId,
      banner_location: bannerLocation,
      href_url: hrefUrl,
      app_url: appUrl,
    } = await ctx.request.validateUsing(vine.compile(createBannerValidator), {
      data: raw,
    })

    // if product_category_id is provided, ensure it exists
    if (productCategoryId) {
      const pc = await db.query.productCategories.findFirst({
        where: eq(tb.productCategories.id, productCategoryId),
      })
      if (!pc) {
        ctx.session.flashErrors({ product_category_id: 'Product category not found' })
        return ctx.response.redirect().back()
      }
    }

    const image = await db.query.fileManager.findFirst({
      where: eq(tb.fileManager.id, imageId),
    })

    if (!image) {
      ctx.session.flashErrors({ image_id: 'Image not found' })
      return ctx.response.redirect().back()
    }

    await db.insert(tb.banners).values({
      title,
      image_url: image?.url ?? '',
      description: description ?? null,
      is_available: isAvailable ?? true,
      product_category_id: productCategoryId ?? null,
      banner_location: bannerLocation,
      href_url: hrefUrl ?? null,
      app_url: appUrl ?? null,
    })

    ctx.session.flashMessages.set('success', 'Banner created successfully')
    return ctx.response.redirect().back()
  }

  async postDelete(ctx: HttpContext) {
    const schema = vine.object({ id: vine.string().uuid() })
    const { id } = await ctx.request.validateUsing(vine.compile(schema), {
      data: ctx.request.params(),
    })

    const banner = await db.query.banners.findFirst({ where: eq(tb.banners.id, id) })
    if (!banner) {
      ctx.session.flashMessages.set('error', 'Banner not found')
      return ctx.response.redirect().back()
    }

    await db.delete(tb.banners).where(eq(tb.banners.id, id))
    ctx.session.flashMessages.set('success', 'Banner deleted successfully')
    return ctx.response.redirect().back()
  }
}
