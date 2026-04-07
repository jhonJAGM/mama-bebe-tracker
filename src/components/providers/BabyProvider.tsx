'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import OnboardingModal from '@/components/shared/OnboardingModal'

export default function BabyProvider({ children }: { children: React.ReactNode }) {
  const { setBaby, baby } = useAppStore()
  const [noBaby, setNoBaby] = useState(false)

  useEffect(() => {
    fetch('/api/baby')
      .then(r => r.json())
      .then(data => {
        if (data.baby) {
          setBaby(data.baby)
          setNoBaby(false)
        } else {
          setNoBaby(true)
        }
      })
      .catch(() => {
        // Si falla la red, no forzar onboarding (puede ser offline)
      })
  }, [setBaby])

  // Si ya tenemos baby en el store, no mostrar onboarding
  const showOnboarding = noBaby && !baby

  return (
    <>
      {showOnboarding && <OnboardingModal />}
      {children}
    </>
  )
}
