export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* TODO: Adicionar sidebar aqui */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 