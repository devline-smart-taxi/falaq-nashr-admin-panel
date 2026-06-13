import { createCrudApi } from '@/lib/crud'
import type { CreatePlanInput, Plan, UpdatePlanInput } from '@/types/plan'

export const plansApi = createCrudApi<Plan, CreatePlanInput, UpdatePlanInput>({
  basePath: '/subscription-plans',
  listIsArray: true, // GET /subscription-plans → PlanDto[] (paginatsiyasiz)
})
