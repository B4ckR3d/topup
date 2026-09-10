import { ProductBillingType } from '@umbreon/db/types'
import { data, Link } from 'react-router'
import z from 'zod'
import { apiClient } from '~/utils/axios'
import type { Route } from './+types/slug'
import OrderSlugPostpaidPage from './slug-postpaid'
import OrderSlugPrepaidPage from './slug-prepaid'

export async function loader({ params }: Route.LoaderArgs) {
  try {
    const slug = params.slug

    if (!slug) {
      throw new Response('Slug not found', { status: 404 })
    }

    const response = await apiClient.get(`/product-categories/slug/${slug}`)

    // console.log(
    //   'Order slug page loaded successfully:',
    //   response.data.data.product_sub_categories[0],
    // )

    return data({
      success: true,
      message: 'Order details loaded successfully',
      data: response?.data.data,
    })
  } catch (_) {
    // console.error('Error loading order slug page:', error)
    return data({
      success: false,
      message: 'Failed to load order details. Please try again later.',
      data: null,
    })
  }
}

export const inquirySchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  voucher_id: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.email('Invalid email format'),
  payment_method_id: z.string().optional(), // Optional, untuk preselection
  input_fields: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        value: z.string().min(1, 'Value is required'),
      }),
    )
    .min(1, 'At least one input field is required'),
})

export type InquiryForm = z.infer<typeof inquirySchema>

export type OrderProducts = {
  id: string
  name: string
  image_url: string
  price: number
  is_available: boolean
  is_featured: boolean
  notes: string | null
  stock: number
  billing_type: string
  cut_off_start: string
  cut_off_end: string
  description: string
  label_text: string | null
  sku_code: string
  sub_name: string
  label_image: string | null
  discount: number
  total_price: number
  input_fields?: InputField[]
}

export type ProductSubCategory = {
  id: string
  name: string
  billing_type: string
  products: OrderProducts[]
}

export type InputField = {
  name: string
  title: string
  type: string
  placeholder: string
  is_required: boolean
  options?: Array<{
    label: string
    value: string
  }>
}

export type ProductCategoryData = {
  id: string
  name: string
  description: string | null
  image_url: string
  banner_url?: string
  billing_type: string
  type?: string // e.g., 'pln_postpaid', 'pdam_postpaid', etc.
  product_sub_categories: ProductSubCategory[]
  input_fields: InputField[]
  product_billing_type?: ProductBillingType
}

export type LoaderData = {
  success: boolean
  message: string
  data: ProductCategoryData | null
}

export default function OrderSlugPage({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData

  if (!data) {
    return (
      <div className="md:max-w-4xl mx-auto py-20 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Produk Belum Tersedia</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Kategori produk ini belum tersedia atau sedang disiapkan oleh admin toko.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:opacity-90 transition-opacity"
        >
          Kembali ke Beranda
        </Link>
      </div>
    )
  }

  // Then check billing type
  if (data.product_billing_type === ProductBillingType.POSTPAID) {
    return <OrderSlugPostpaidPage data={data} />
  }

  // Default: render prepaid page component
  return <OrderSlugPrepaidPage data={data} loaderData={loaderData} />
}
