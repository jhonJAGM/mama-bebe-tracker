import { Card, CardContent } from '@/components/ui/card'

const SECTIONS = [
  { href: '/bebe/tomas', icon: '🍼', label: 'Tomas de leche', desc: 'Pecho y biberón' },
  { href: '/bebe/panales', icon: '👶', label: 'Pañales', desc: 'Registro de cambios' },
  { href: '/bebe/sueno', icon: '😴', label: 'Sueño', desc: 'Siestas y sueño nocturno' },
  { href: '/bebe/crecimiento', icon: '📈', label: 'Crecimiento', desc: 'Peso, talla y cefálico' },
]

export default function BebePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">🍼 Bebé</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Selecciona qué registrar</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SECTIONS.map(({ href, icon, label, desc }) => (
          <a key={href} href={href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md active:scale-[0.97] h-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <span className="text-4xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
