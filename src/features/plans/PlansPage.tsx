import { Form, InputNumber, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ResourceListPage } from '@/components/crud/ResourceListPage'
import { LocalizedTextInput } from '@/components/form/LocalizedTextInput'
import { ActiveTag } from '@/components/common/ActiveTag'
import { useAuthStore } from '@/stores/auth'
import { localize, formatUZS } from '@/lib/localize'
import { saveResource } from '@/lib/crud'
import { normalizeLT, requireLT, requiredLTRule } from '@/lib/lt'
import type { Plan, CreatePlanInput } from '@/types/plan'
import type { LocalizedText } from '@/types/api'
import { plansApi } from './api'

interface FormValues {
  name: LocalizedText
  description?: LocalizedText
  price: number
  periodDays: number
  sortOrder: number
  isActive: boolean
}

export function PlansPage() {
  const lang = useAuthStore((s) => s.lang)

  const columns: ColumnsType<Plan> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (_, r) => localize(r.name, lang),
    },
    {
      title: 'Narx',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right',
      render: (v: number) => formatUZS(v),
    },
    {
      title: 'Muddat',
      dataIndex: 'periodDays',
      key: 'periodDays',
      width: 110,
      render: (v: number) => `${v} kun`,
    },
    {
      title: 'Tartib',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (v: boolean) => <ActiveTag active={v} />,
    },
  ]

  return (
    <ResourceListPage<Plan, FormValues>
      title="Obuna tariflari"
      queryKey="plans"
      api={plansApi}
      columns={columns}
      searchable={false}
      newButtonLabel="Yangi tarif"
      initialValues={{
        name: { uz: '' },
        description: { uz: '' },
        price: 0,
        periodDays: 30,
        sortOrder: 0,
        isActive: true,
      }}
      toFormValues={(r) => ({
        name: r.name,
        description: r.description ?? { uz: '' },
        price: r.price,
        periodDays: r.periodDays,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
      })}
      onSubmit={async (values, editing) => {
        const buildInput = (): CreatePlanInput => ({
          name: requireLT(values.name),
          description: normalizeLT(values.description),
          price: values.price,
          periodDays: values.periodDays,
          sortOrder: values.sortOrder ?? 0,
          isActive: values.isActive,
        })
        return (await saveResource({ api: plansApi, editing, buildInput })).message
      }}
      renderFields={() => (
        <>
          <Form.Item name="name" label="Nom" required rules={[requiredLTRule]}>
            <LocalizedTextInput placeholder="Masalan: Oylik obuna" />
          </Form.Item>
          <Form.Item name="description" label="Tavsif">
            <LocalizedTextInput multiline placeholder="Tarif haqida" />
          </Form.Item>
          <Form.Item
            name="price"
            label="Narx (so'm)"
            rules={[{ required: true, message: 'Narx majburiy' }]}
          >
            <InputNumber<number>
              min={0}
              step={1000}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(v) => Number((v ?? '').replace(/\s/g, ''))}
            />
          </Form.Item>
          <Form.Item
            name="periodDays"
            label="Muddat (kun)"
            rules={[{ required: true, message: 'Muddat majburiy' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sortOrder" label="Tartib raqami" tooltip="Kichik — oldinroq">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Faol" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  )
}
