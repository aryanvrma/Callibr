import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin()

  return (
    <div>
      <nav className="border-b p-4 flex items-center justify-between">
        <span className="font-semibold">Callibr Admin</span>
        <span className="text-sm text-gray-500">{profile?.full_name}</span>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  )
}
