import { Tag } from 'antd'

export function ActiveTag({ active }: { active: boolean }) {
  return <Tag color={active ? 'green' : 'default'}>{active ? 'Faol' : 'Nofaol'}</Tag>
}
