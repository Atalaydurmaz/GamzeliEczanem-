import AdminSessionGuard from './AdminSessionGuard'

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminSessionGuard />
      {children}
    </>
  )
}
