export { auth as middleware } from '@/lib/auth'

export const config = {
  // Protege todo excepto: archivos estáticos, rutas de auth y recursos PWA
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
}
