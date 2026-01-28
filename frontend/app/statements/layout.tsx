import { AppLayout } from '@/components/AppLayout'

export default function StatementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
