import { AppLayout } from '@/components/AppLayout'

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
