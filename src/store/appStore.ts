import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type BabyProfile = {
  _id: string
  name: string
  birthDate: string
}

type AlertsConfig = {
  feedingAlertEnabled: boolean
  medAlertEnabled: boolean
  dailySummaryEnabled: boolean
  alertPhone: string
}

type AppState = {
  // Perfil del bebé activo
  babyId: string | null
  baby: BabyProfile | null

  // Configuración de alertas
  alertsConfig: AlertsConfig

  // Última sincronización con el servidor
  lastSyncAt: string | null

  // Actions
  setBaby: (baby: BabyProfile) => void
  clearBaby: () => void
  setAlertsConfig: (config: Partial<AlertsConfig>) => void
  setLastSync: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      babyId: null,
      baby: null,
      alertsConfig: {
        feedingAlertEnabled: true,
        medAlertEnabled: true,
        dailySummaryEnabled: true,
        alertPhone: '',
      },
      lastSyncAt: null,

      setBaby: (baby) => set({ babyId: baby._id, baby }),
      clearBaby: () => set({ babyId: null, baby: null }),
      setAlertsConfig: (config) =>
        set((state) => ({
          alertsConfig: { ...state.alertsConfig, ...config },
        })),
      setLastSync: () => set({ lastSyncAt: new Date().toISOString() }),
    }),
    {
      name: 'noecare-app',
      // Solo persiste la configuración, no el perfil completo (se recarga del servidor)
      partialize: (state) => ({
        babyId: state.babyId,
        alertsConfig: state.alertsConfig,
      }),
    }
  )
)
