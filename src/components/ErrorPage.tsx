import { useRouteError, useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd'

/** Marshrutда kutilmagan xato yuz berganда ko'rsatiladigan sahifa. */
export function ErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  // Texnik detallar foydalanuvchiga ko'rsatilmaydi — faqat console (dev).
  console.error('[Route error]', error)

  return (
    <Result
      status="error"
      title="Xatolik yuz berdi"
      subTitle="Kutilmagan xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring."
      extra={[
        <Button type="primary" key="reload" onClick={() => window.location.reload()}>
          Sahifani yangilash
        </Button>,
        <Button key="home" onClick={() => navigate('/')}>
          Bosh sahifa
        </Button>,
      ]}
      style={{ paddingTop: 64 }}
    />
  )
}
