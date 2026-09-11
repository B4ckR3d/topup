import type { InferPageProps } from '@adonisjs/inertia/types'
import { router } from '@inertiajs/react'
import { Button } from '@umbreon/ui/components/ui/button'
import { Card, CardContent } from '@umbreon/ui/components/ui/card'
import { LoaderCircle, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import type ProductsCategoriesController from '#controllers/product_categories_controller'
import AddInputFields from './add-input-fields'

type Props = {
  productCategory: InferPageProps<ProductsCategoriesController, 'detail'>['productCategory']
}

export default function SectionInputFields({ productCategory }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDeleteInput = (inputId: string) => {
    router.delete(`/admin/input-fields/disconnect/${inputId}`, {
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    })
  }

  return (
    <section className="mt-6">
      <div className="flex justify-between items-end">
        <h3 className="font-semibold text-lg">Input Fields</h3>
        <AddInputFields productCategoryId={productCategory.id} />
      </div>
      <div className="mt-2">
        {(!productCategory.input_on_product_category ||
          productCategory.input_on_product_category.length < 1) && (
          <p className="text-sm text-center">No input found</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productCategory.input_on_product_category?.map((input) => (
            <Card key={input.id} className="py-0 shadow-none">
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div>
                  <h4 className="font-semibold text-sm">{input.input_field?.identifier || '-'}</h4>
                  <p className="text-sm text-muted-foreground">{input.input_field?.type || '-'}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleDeleteInput(input.id)}
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin duration-300" />
                  ) : (
                    <Trash2Icon />
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
