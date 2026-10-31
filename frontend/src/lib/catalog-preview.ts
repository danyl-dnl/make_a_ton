import type { Plan, PlanInput, Product, ProductInput } from './catalog-types'

/**
 * TEMPORARY PREVIEW SOURCE ONLY. No records are seeded or persisted; data exists only
 * in this JavaScript session and is discarded on reload. Never use this source as production data.
 */
let products: Product[] = []
let plans: Plan[] = []

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const previewCatalog = {
  listProducts: async () => [...products],
  createProduct: async (input: ProductInput) => {
    const record: Product = { ...input, id: createId(), createdAt: new Date().toISOString() }
    products = [record, ...products]
    return record
  },
  updateProduct: async (id: string, input: ProductInput) => {
    const index = products.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('This product is no longer available. Refresh the list and try again.')
    products = products.map((item) => item.id === id ? { ...item, ...input } : item)
    return products[index]
  },
  deleteProduct: async (id: string) => { products = products.filter((item) => item.id !== id) },
  listPlans: async () => [...plans],
  createPlan: async (input: PlanInput) => {
    const record: Plan = { ...input, id: createId(), createdAt: new Date().toISOString() }
    plans = [record, ...plans]
    return record
  },
  updatePlan: async (id: string, input: PlanInput) => {
    const index = plans.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('This plan is no longer available. Refresh the list and try again.')
    plans = plans.map((item) => item.id === id ? { ...item, ...input } : item)
    return plans[index]
  },
  deletePlan: async (id: string) => { plans = plans.filter((item) => item.id !== id) },
}
