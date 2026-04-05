'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export default function BabyProvider({ children }: { children: React.ReactNode }) {
  const { setBaby } = useAppStore()

  useEffect(() => {
    // Siempre sincronizar con la BD al montar (por si localStorage expiró)
    fetch('/api/baby')
      .then(r => r.json())
      .then(data => {
        if (data.baby) setBaby(data.baby)
      })
      .catch(console.error)
  }, [setBaby])

  return <>{children}</>
}
