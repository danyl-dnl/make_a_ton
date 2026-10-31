import { catalogApi } from './catalog-api'
import { previewCatalog } from './catalog-preview'
import type { CatalogPage, Plan, PlanInput, Product, ProductInput } from './catalog-types'

const usePreview = !import.meta.env.VITE_API_BASE_URL

/** UI-facing catalog service; preview source is isolated and visibly identified by source. */
export const catalogService = {
  source: usePreview ? 'preview' as const : 'api' as const,
  async listProducts(): Promise<CatalogPage<Product>> { return { items: usePreview ? await previewCatalog.listProducts() : await catalogApi.listProducts(), source: usePreview ? 'preview' : 'api' } },
  createProduct: (input: ProductInput) => usePreview ? previewCatalog.createProduct(input) : catalogApi.createProduct(input),
  updateProduct: (id: string, input: ProductInput) => usePreview ? previewCatalog.updateProduct(id, input) : catalogApi.updateProduct(id, input),
  deleteProduct: (id: string) => usePreview ? previewCatalog.deleteProduct(id) : catalogApi.deleteProduct(id),
  async listPlans(): Promise<CatalogPage<Plan>> { return { items: usePreview ? await previewCatalog.listPlans() : await catalogApi.listPlans(), source: usePreview ? 'preview' : 'api' } },
  createPlan: (input: PlanInput) => usePreview ? previewCatalog.createPlan(input) : catalogApi.createPlan(input),
  updatePlan: (id: string, input: PlanInput) => usePreview ? previewCatalog.updatePlan(id, input) : catalogApi.updatePlan(id, input),
  deletePlan: (id: string) => usePreview ? previewCatalog.deletePlan(id) : catalogApi.deletePlan(id),
}
