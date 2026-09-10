import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    const { session, auth } = ctx as Partial<HttpContext>
    const validationErrors = this.getValidationErrors(ctx)
    const sessionErrors = (session?.flashMessages.get('errorsBag') || {}) as Record<string, any>
    const flashError = session?.flashMessages.get('error')

    const mergedErrors = {
      ...validationErrors,
      ...sessionErrors,
      ...(flashError ? { error: flashError } : {}),
    }

    return {
      errors: ctx.inertia.always(mergedErrors),
      flash: ctx.inertia.always({
        error: flashError || sessionErrors.error,
        success: session?.flashMessages.get('success'),
      }),
      user: ctx.inertia.always(auth?.user ?? undefined),
    }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const output = await next()
    this.dispose(ctx)
    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = import('@adonisjs/inertia/types').InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
