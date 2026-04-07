export { auth as middleware } from '@/lib/auth'

export const config = {
  // Protege todo excepto: archivos estáticos, rutas de auth y recursos PWA
  matcher: [
    '/((?!login|offline|api/auth|api/whatsapp|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|sw-register.js).*)',
  ],
}
