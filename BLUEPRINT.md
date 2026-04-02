# BLUEPRINT: mama-bebe-tracker PWA

> Guia completa para desarrollar desde VS Code con Claude Code

**Proyecto:** App de seguimiento para bebe recien nacida y mama post-cesarea  
**Tipo:** Progressive Web App (PWA) instalable en tablet Android  
**Stack:** Next.js 14 + MongoDB + Railway + Evolution API + Google Calendar  

---

## INDICE

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Arquitectura](#3-arquitectura)
4. [Modulos de la App](#4-modulos-de-la-app)
5. [Estructura de Carpetas](#5-estructura-de-carpetas)
6. [MongoDB Schemas](#6-mongodb-schemas)
7. [API Routes](#7-api-routes)
8. [Variables de Entorno](#8-variables-de-entorno)
9. [Integraciones Externas](#9-integraciones-externas)
10. [Activar Google APIs](#10-activar-google-apis)
11. [Pipeline CI/CD](#11-pipeline-cicd)
12. [Setup e Instalacion](#12-setup-e-instalacion)
13. [Plan de Desarrollo por Fases](#13-plan-de-desarrollo-por-fases)
14. [Comandos para Claude Code](#14-comandos-para-claude-code)
15. [Checklist de Lanzamiento](#15-checklist-de-lanzamiento)

---

## 1. RESUMEN DEL PROYECTO

### Objetivo
Aplicacion PWA instalable en tablet Android para el seguimiento integral de:
- **Bebe recien nacida**: alimentacion, crecimiento, panales, sueno, vacunas
- **Mama post-cesarea**: medicamentos, reposo, herida, dolor, recuperacion

### Usuarios
| Usuario | Rol |
|---|---|
| Mama/Papa | Usuario principal en tablet |
| Bot WhatsApp | Receptor de alertas automaticas |
| Medico (futuro) | Consulta de bitacora |

### Plataforma objetivo
- Tablet Android (modo landscape y portrait)
- PWA instalable desde Chrome/navegador
- Sin necesidad de Google Play Store

---

## 2. STACK TECNOLOGICO

| Capa | Tecnologia | Version | Uso |
|---|---|---|---|
| Frontend | Next.js | 14.x (App Router) | UI + API Routes |
| Estilos | Tailwind CSS | 3.x | Diseño responsive tablet |
| Componentes | shadcn/ui | latest | Formularios, tarjetas |
| Graficas | Recharts | 2.x | Curvas de crecimiento |
| Backend | Next.js API Routes | - | REST API integrada |
| Base de datos | MongoDB Atlas | 7.x | Almacenamiento principal |
| ODM | Mongoose | 8.x | Schemas y modelos |
| Auth | NextAuth.js | 5.x | Google OAuth + JWT |
| WhatsApp | Evolution API | (ya tienes) | Alertas via bot |
| Calendario | Google Calendar API | v3 | Citas y recordatorios |
| Push notifications | Firebase FCM | 9.x | Notif. nativas tablet |
| Cron jobs | node-cron | 3.x | Recordatorios automaticos |
| Deploy backend | Railway | - | Hosting + env vars |
| CI/CD | GitHub Actions | - | Auto-deploy en push |
| Gestion estado | Zustand | 4.x | Estado global cliente |

---

## 3. ARQUITECTURA

```
+--------------------------------------------------+
|           TABLET ANDROID (PWA Chrome)            |
|   Next.js 14 App Router - Installable PWA        |
|                                                  |
|  [Dashboard] [Bebe] [Mama] [Calendario] [Notas]  |
|                                                  |
|  Service Worker + IndexedDB (offline support)    |
+---------------------+----------------------------+
                      |
                HTTPS REST API
                      |
+---------------------v----------------------------+
|           RAILWAY (Backend + SSR)                |
|   Next.js API Routes / node-cron                 |
|                                                  |
|  /api/auth   - NextAuth Google OAuth             |
|  /api/baby   - peso, talla, vacunas              |
|  /api/feed   - tomas, lactancia, formula         |
|  /api/diaper - panales                           |
|  /api/sleep  - sueno bebe                        |
|  /api/meds   - medicamentos mama+bebe            |
|  /api/mom    - reposo, dolor, herida             |
|  /api/alerts - disparar mensajes Wapp            |
|  /api/calendar - sync Google Calendar            |
|  /api/notes  - bitacora libre                    |
+----+----------+----------+-----------+-----------+
     |          |          |           |
+----v----+ +---v----+ +---v----+ +----v----+
|MongoDB  | |Evol.   | |Google  | |Firebase |
|Atlas    | |API     | |Cal.API | |FCM      |
|         | |(Wapp   | |        | |(Push    |
|Datos    | |bot)    | |Citas   | |notif.)  |
+---------+ +--------+ +--------+ +---------+
```

### Flujo de datos principal

```
[Tablet] --> POST /api/feed --> MongoDB (guarda toma)
                            --> Cron verifica proxima toma
                            --> Evolution API envia Wapp alert
                            --> FCM notifica tablet
```

---

## 4. MODULOS DE LA APP

### Modulo 1: BEBE

| Funcionalidad | Descripcion |
|---|---|
| Control de peso | Registro diario/semanal con grafica de curva |
| Control de talla | Registro semanal |
| Tomas de leche | Hora, tipo (pecho izq/der/formula), duracion, ml |
| Panales | Hora, tipo (pipi/caca), color, consistencia |
| Sueno | Inicio, fin, tipo (dia/noche), calidad |
| Vacunas | Fecha, vacuna, lote, reaccion |
| Bano | Frecuencia, temperatura agua |

### Modulo 2: MAMA (post-cesarea)

| Funcionalidad | Descripcion |
|---|---|
| Escala de dolor | 1-10 con hora y zona |
| Estado de herida | Fotos + descripcion (limpia, enrojecida, etc.) |
| Medicamentos | Nombre, dosis, frecuencia, ultima toma, proxima |
| Reposo | Nivel actividad permitida, horas en cama |
| Loquios | Color, cantidad (seguimiento hemorragia) |
| Temperatura | Control fiebre post-operatorio |
| Sintomas alarma | Checklist: fiebre, sangrado excesivo, dolor |

### Modulo 3: ALERTAS WHATSAPP

| Tipo de Alerta | Trigger | Mensaje |
|---|---|---|
| Toma de leche | Cada X horas segun config | "Bebe necesita tomar leche - ultima toma: 14:30" |
| Medicamento mama | Segun frecuencia configurada | "Hora del medicamento: Ibuprofeno 400mg" |
| Medicamento bebe | Segun prescripcion | "Vitamina D bebe - 5 gotas" |
| Cita medica | 24h y 1h antes | "Cita pediatra manana 10:00am - Clinica X" |
| Alarma critica | Manual o automatica | "ALERTA: temperatura bebe 38.5 grados" |

### Modulo 4: CALENDARIO

| Funcionalidad | Descripcion |
|---|---|
| Sync Google Calendar | OAuth2 bidireccional |
| Citas pediatra | Crear desde app, sync a Google Cal |
| Citas ginecologia | Seguimiento post-cesarea |
| Controles peso/talla | Programados por el usuario |
| Vista semanal/mensual | UI adaptada para tablet |

### Modulo 5: BITACORA

| Funcionalidad | Descripcion |
|---|---|
| Notas diarias | Texto libre, emojis |
| Fotos del bebe | Galeria con fecha/hora |
| Hitos | Primera sonrisa, primera palabra, etc. |
| Exportar PDF | Reporte semanal/mensual descargable |

---

## 5. ESTRUCTURA DE CARPETAS

```
mama-bebe-tracker/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login con Google
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout con navbar tablet
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── bebe/
│   │   │   ├── page.tsx          # Resumen del bebe
│   │   │   ├── tomas/
│   │   │   │   └── page.tsx      # Registro tomas
│   │   │   ├── crecimiento/
│   │   │   │   └── page.tsx      # Graficas peso/talla
│   │   │   ├── pañales/
│   │   │   │   └── page.tsx      # Registro panales
│   │   │   └── sueno/
│   │   │       └── page.tsx      # Registro sueno
│   │   ├── mama/
│   │   │   ├── page.tsx          # Resumen mama
│   │   │   ├── medicamentos/
│   │   │   │   └── page.tsx      # Medicamentos + alertas
│   │   │   └── recuperacion/
│   │   │       └── page.tsx      # Dolor, herida, signos
│   │   ├── calendario/
│   │   │   └── page.tsx          # Calendario Google sync
│   │   ├── alertas/
│   │   │   └── page.tsx          # Config alertas Wapp
│   │   └── bitacora/
│   │       └── page.tsx          # Notas + fotos + hitos
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts      # NextAuth Google OAuth
│       ├── baby/
│       │   └── route.ts          # GET/POST datos bebe
│       ├── feed/
│       │   └── route.ts          # GET/POST tomas
│       ├── diaper/
│       │   └── route.ts          # GET/POST panales
│       ├── sleep/
│       │   └── route.ts          # GET/POST sueno
│       ├── meds/
│       │   └── route.ts          # GET/POST medicamentos
│       ├── mom/
│       │   └── route.ts          # GET/POST registros mama
│       ├── alerts/
│       │   └── route.ts          # POST enviar alerta Wapp
│       ├── calendar/
│       │   ├── route.ts          # GET/POST eventos
│       │   └── sync/
│       │       └── route.ts      # Sync con Google Calendar
│       └── notes/
│           └── route.ts          # GET/POST bitacora
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── NextFeedAlert.tsx
│   │   └── QuickActions.tsx
│   ├── bebe/
│   │   ├── FeedForm.tsx
│   │   ├── GrowthChart.tsx
│   │   ├── DiaperForm.tsx
│   │   └── SleepTracker.tsx
│   ├── mama/
│   │   ├── PainScale.tsx
│   │   ├── MedReminder.tsx
│   │   └── WoundStatus.tsx
│   ├── calendario/
│   │   └── CalendarView.tsx
│   └── shared/
│       ├── TabletNav.tsx         # Navegacion adaptada tablet
│       └── AlertBadge.tsx
├── lib/
│   ├── mongodb.ts                # Conexion MongoDB
│   ├── evolution-api.ts          # Cliente Evolution API
│   ├── google-calendar.ts        # Cliente Google Calendar
│   ├── firebase-admin.ts         # Firebase Admin SDK
│   └── cron-jobs.ts              # Recordatorios automaticos
├── models/
│   ├── Baby.ts
│   ├── Feeding.ts
│   ├── Diaper.ts
│   ├── Sleep.ts
│   ├── Medication.ts
│   ├── MomLog.ts
│   ├── Event.ts
│   └── Note.ts
├── hooks/
│   ├── useBabyData.ts
│   ├── useAlerts.ts
│   └── useCalendar.ts
├── store/
│   └── appStore.ts               # Zustand global state
├── types/
│   └── index.ts                  # TypeScript types
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   └── icons/                   # PWA icons (192x192, 512x512)
├── .env.local                    # Variables de entorno (NO commitear)
├── .env.example                  # Plantilla de variables
├── next.config.js                # Config Next.js + PWA
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## 6. MONGODB SCHEMAS

### Collection: babies
```typescript
{
  _id: ObjectId,
  name: string,           // Nombre de la bebe
  birthDate: Date,        // Fecha de nacimiento
  birthWeight: number,    // Peso al nacer (gramos)
  birthHeight: number,    // Talla al nacer (cm)
  bloodType: string,      // Grupo sanguineo
  allergies: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: feedings
```typescript
{
  _id: ObjectId,
  babyId: ObjectId,
  type: 'breast_left' | 'breast_right' | 'formula' | 'mixed',
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
  amountMl: number,       // Si es formula
  notes: string,
  createdAt: Date
}
```

### Collection: diapers
```typescript
{
  _id: ObjectId,
  babyId: ObjectId,
  time: Date,
  type: 'pee' | 'poop' | 'both' | 'dry',
  color: string,          // amarillo, verde, negro (meconio), etc.
  consistency: string,    // liquida, pastosa, solida
  notes: string,
  createdAt: Date
}
```

### Collection: sleeps
```typescript
{
  _id: ObjectId,
  babyId: ObjectId,
  startTime: Date,
  endTime: Date,
  durationMinutes: number,
  type: 'day' | 'night',
  quality: 1 | 2 | 3 | 4 | 5,
  location: string,       // cuna, brazos, coche, etc.
  notes: string,
  createdAt: Date
}
```

### Collection: medications
```typescript
{
  _id: ObjectId,
  patientType: 'baby' | 'mom',
  patientId: ObjectId,
  name: string,
  dosage: string,         // "400mg", "5 gotas"
  frequencyHours: number, // Cada cuantas horas
  startDate: Date,
  endDate: Date,
  lastTaken: Date,
  nextDue: Date,
  active: boolean,
  alertWapp: boolean,     // Enviar alerta Wapp
  notes: string,
  createdAt: Date
}
```

### Collection: mom_logs
```typescript
{
  _id: ObjectId,
  date: Date,
  painLevel: number,      // 1-10
  painZone: string,       // herida, cabeza, espalda, etc.
  temperature: number,    // Celsius
  woundStatus: 'clean' | 'red' | 'secretion' | 'open',
  woundPhoto: string,     // URL foto
  lochiaColor: 'red' | 'pink' | 'brown' | 'yellow' | 'white',
  lochiaAmount: 'light' | 'moderate' | 'heavy',
  activityLevel: 'bed_rest' | 'walking' | 'light' | 'normal',
  mood: 1 | 2 | 3 | 4 | 5,
  notes: string,
  createdAt: Date
}
```

### Collection: events
```typescript
{
  _id: ObjectId,
  title: string,
  description: string,
  type: 'pediatrician' | 'gynecologist' | 'vaccine' | 'weight_check' | 'other',
  startDate: Date,
  endDate: Date,
  location: string,
  googleCalendarId: string,   // ID en Google Calendar
  alertWapp24h: boolean,
  alertWapp1h: boolean,
  createdAt: Date
}
```

### Collection: notes
```typescript
{
  _id: ObjectId,
  date: Date,
  title: string,
  content: string,        // Texto libre
  type: 'note' | 'milestone' | 'photo',
  photoUrl: string,       // URL si tiene foto
  milestone: string,      // Primera sonrisa, etc.
  createdAt: Date,
  updatedAt: Date
}
```

---

## 7. API ROUTES

| Metodo | Ruta | Descripcion | Body / Query |
|---|---|---|---|
| GET | /api/baby | Obtener datos bebe actual | - |
| POST | /api/baby | Crear/actualizar perfil bebe | {name, birthDate, ...} |
| GET | /api/feed | Listar tomas (con paginacion) | ?limit=20&page=1 |
| POST | /api/feed | Registrar nueva toma | {type, startTime, durationMinutes, amountMl} |
| GET | /api/diaper | Listar panales del dia | ?date=2024-01-15 |
| POST | /api/diaper | Registrar panal | {type, time, color, consistency} |
| GET | /api/sleep | Listar registros sueno | ?days=7 |
| POST | /api/sleep | Iniciar/terminar sesion sueno | {startTime, endTime, type} |
| GET | /api/meds | Listar medicamentos activos | ?patientType=baby |
| POST | /api/meds | Crear medicamento + alarma | {name, dosage, frequencyHours, ...} |
| PATCH | /api/meds/:id | Marcar como tomado | {lastTaken: Date} |
| GET | /api/mom | Ultimo registro mama | - |
| POST | /api/mom | Registrar estado mama | {painLevel, temperature, woundStatus, ...} |
| GET | /api/calendar | Listar eventos proximos | ?days=30 |
| POST | /api/calendar | Crear evento | {title, startDate, type, alertWapp24h} |
| POST | /api/calendar/sync | Sincronizar con Google Calendar | - |
| POST | /api/alerts/wapp | Enviar mensaje WhatsApp | {number, message, type} |
| GET | /api/notes | Listar notas | ?type=milestone&limit=10 |
| POST | /api/notes | Crear nota o hito | {title, content, type, photoUrl} |
| GET | /api/stats/baby | Stats: tomas hoy, panales, sueno | - |
| GET | /api/stats/growth | Datos para graficas peso/talla | ?months=3 |

---

## 8. VARIABLES DE ENTORNO

Crea el archivo `.env.local` en la raiz del proyecto:

```env
# ==========================================
# BASE DE DATOS
# ==========================================
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/mama-bebe-tracker

# ==========================================
# AUTH (NextAuth.js)
# ==========================================
NEXTAUTH_SECRET=una-clave-secreta-aleatoria-larga-aqui
NEXTAUTH_URL=http://localhost:3000

# ==========================================
# GOOGLE OAUTH + CALENDAR API
# (obtener en console.cloud.google.com)
# ==========================================
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# ==========================================
# EVOLUTION API (WhatsApp bot - ya tienes)
# ==========================================
EVOLUTION_API_URL=https://tu-evolution-api.railway.app
EVOLUTION_API_KEY=tu-api-key-de-evolution
EVOLUTION_INSTANCE=nombre-de-tu-instancia
WHATSAPP_TARGET_NUMBER=57300XXXXXXX@s.whatsapp.net

# ==========================================
# FIREBASE (Push notifications en tablet)
# ==========================================
FIREBASE_SERVER_KEY=AAAA-xxxxxxxx-tu-server-key
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# ==========================================
# APP
# ==========================================
NEXT_PUBLIC_APP_URL=https://mama-bebe-tracker.railway.app
NODE_ENV=development
```

> IMPORTANTE: Nunca commitees `.env.local`. Esta en `.gitignore` por defecto.

---

## 9. INTEGRACIONES EXTERNAS

### 9.1 Evolution API (WhatsApp)

Ya tienes el bot funcionando. Usa este cliente en `lib/evolution-api.ts`:

```typescript
// lib/evolution-api.ts
const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE = process.env.EVOLUTION_INSTANCE

export async function sendWhatsAppAlert(
  number: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `${EVOLUTION_URL}/message/sendText/${INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    }
  )
  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.statusText}`)
  }
}

// Ejemplo de uso en /api/alerts/route.ts:
// await sendWhatsAppAlert('57300XXXXXXX@s.whatsapp.net', 'Hora de la toma!')
```

### 9.2 Google Calendar API (OAuth2)

Flujo OAuth2 con NextAuth.js para acceder al calendario del usuario:

```typescript
// lib/google-calendar.ts
import { google } from 'googleapis'

export function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth })
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    title: string
    startDate: Date
    endDate: Date
    description?: string
  }
) {
  const calendar = getCalendarClient(accessToken)
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startDate.toISOString() },
      end: { dateTime: event.endDate.toISOString() },
    },
  })
  return response.data
}
```

### 9.3 Firebase FCM (Push Notifications)

```typescript
// public/sw.js (Service Worker - ya incluye FCM)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({ /* tu config publica */ })
const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  })
})
```

### 9.4 Cron Jobs (node-cron)

```typescript
// lib/cron-jobs.ts - se inicia en el servidor
import cron from 'node-cron'
import { checkMedicationAlerts } from './alerts'
import { checkFeedingAlerts } from './alerts'

// Cada 30 minutos: verificar si hay alertas pendientes
cron.schedule('*/30 * * * *', async () => {
  await checkMedicationAlerts()
  await checkFeedingAlerts()
})
```

---

## 10. ACTIVAR GOOGLE APIS

### Paso a paso en Google Cloud Console

1. **Ve a** [console.cloud.google.com](https://console.cloud.google.com)

2. **Crea o selecciona un proyecto**
   - Click en selector de proyecto (arriba)
   - "Nuevo proyecto" > nombre: `mama-bebe-tracker`
   - Click "Crear"

3. **Activa Google Calendar API**
   - Menu lateral > "APIs y servicios" > "Biblioteca"
   - Busca: `Google Calendar API`
   - Click en el resultado > Click "Habilitar"

4. **Crea credenciales OAuth 2.0**
   - Menu > "APIs y servicios" > "Credenciales"
   - Click "+ Crear credenciales" > "ID de cliente OAuth"
   - Tipo de aplicacion: **Aplicacion web**
   - Nombre: `mama-bebe-tracker`
   - URIs de redireccionamiento autorizados:
     ```
     http://localhost:3000/api/auth/callback/google
     https://mama-bebe-tracker.railway.app/api/auth/callback/google
     ```
   - Click "Crear"
   - **Copia:** Client ID y Client Secret al `.env.local`

5. **Configura la pantalla de consentimiento**
   - "APIs y servicios" > "Pantalla de consentimiento de OAuth"
   - Tipo de usuario: **Externo** (o Interno si es personal)
   - Llena nombre de app, email de soporte
   - Agrega scopes:
     ```
     https://www.googleapis.com/auth/calendar.events
     https://www.googleapis.com/auth/calendar.readonly
     https://www.googleapis.com/auth/userinfo.email
     https://www.googleapis.com/auth/userinfo.profile
     ```
   - Agrega tu email como usuario de prueba
   - Guarda y publica

6. **Verifica que funciona**
   - Corre la app localmente
   - Ve a `/login` > "Continuar con Google"
   - Deberia pedir permisos de calendario
   - Tras aceptar, guarda el `access_token` en la sesion

---

## 11. PIPELINE CI/CD

### GitHub Actions → Railway

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Build
        run: npm run build
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: mama-bebe-tracker
```

### Secrets en GitHub (Settings > Secrets > Actions):
```
MONGODB_URI
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
EVOLUTION_API_URL
EVOLUTION_API_KEY
EVOLUTION_INSTANCE
WHATSAPP_TARGET_NUMBER
FIREBASE_SERVER_KEY
RAILWAY_TOKEN
```

### Railway setup:
1. railway.app > "New Project" > "Deploy from GitHub repo"
2. Conecta `jhonjagm/mama-bebe-tracker`
3. Agrega todas las variables de entorno en Railway Dashboard
4. Deploy automatico en cada push a `main`

---

## 12. SETUP E INSTALACION

### Requisitos previos
- Node.js 20.x o superior
- npm 10.x o superior
- Cuenta MongoDB Atlas activa
- Evolution API funcionando (ya tienes)
- Google Cloud credentials (seccion 10)

### Instalacion local

```bash
# 1. Clonar el repositorio
git clone https://github.com/jhonjagm/mama-bebe-tracker.git
cd mama-bebe-tracker

# 2. Instalar dependencias
npm install

# 3. Copiar y configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales reales

# 4. Correr en modo desarrollo
npm run dev
# Abre http://localhost:3000

# 5. Build para produccion
npm run build
npm start
```

### Instalar como PWA en tablet Android

1. Abre Chrome en el tablet
2. Ve a la URL de la app: `https://mama-bebe-tracker.railway.app`
3. Espera que cargue completamente
4. Toca el menu de Chrome (3 puntos)
5. Selecciona "Agregar a pantalla de inicio"
6. Confirma el nombre y toca "Agregar"
7. La app aparece como icono en el escritorio del tablet
8. Abrela desde el icono = funciona como app nativa

### Configurar next.config.js para PWA

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] }
  },
})
```

### public/manifest.json

```json
{
  "name": "Mama & Bebe Tracker",
  "short_name": "BabeTracker",
  "description": "Seguimiento de bebe y mama post-cesarea",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ec4899",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 13. PLAN DE DESARROLLO POR FASES

### FASE 1: Infraestructura y autenticacion (Dias 1-4)
- [ ] Crear proyecto Next.js 14 con TypeScript y Tailwind
- [ ] Configurar MongoDB Atlas y conectar con Mongoose
- [ ] Instalar y configurar NextAuth.js con Google OAuth
- [ ] Crear modelos Mongoose (Baby, Feeding, Diaper, Sleep, Medication, MomLog, Event, Note)
- [ ] Configurar Railway: crear servicio, variables de entorno
- [ ] Configurar GitHub Actions para auto-deploy
- [ ] Instalar shadcn/ui y configurar tema pink/purple para bebes
- [ ] Crear layout base para tablet con navegacion lateral

### FASE 2: Backend - API Routes completa (Dias 5-9)
- [ ] /api/baby: CRUD perfil bebe
- [ ] /api/feed: CRUD tomas de leche
- [ ] /api/diaper: CRUD panales
- [ ] /api/sleep: CRUD sueno
- [ ] /api/meds: CRUD medicamentos con calculo nextDue
- [ ] /api/mom: CRUD registros mama
- [ ] /api/notes: CRUD bitacora y hitos
- [ ] /api/calendar: CRUD eventos + sync Google Calendar
- [ ] /api/alerts/wapp: enviar mensajes via Evolution API
- [ ] /api/stats: estadisticas para dashboard
- [ ] lib/cron-jobs.ts: recordatorios automaticos cada 30min

### FASE 3: Frontend - Pantallas principales (Dias 10-16)
- [ ] Pantalla de Login (Google OAuth)
- [ ] Dashboard principal: tomas hoy, proxima toma, alertas pendientes
- [ ] Modulo Bebe: formulario toma rapida (boton grande, hora automatica)
- [ ] Modulo Bebe: registro panal con iconos visuales
- [ ] Modulo Bebe: cronometro de sueno
- [ ] Modulo Bebe: graficas de peso y talla (Recharts)
- [ ] Modulo Mama: escala de dolor con slider visual
- [ ] Modulo Mama: lista de medicamentos con cuenta regresiva
- [ ] Modulo Mama: formulario de estado diario
- [ ] Calendario: vista semanal/mensual con colores por tipo de cita
- [ ] Bitacora: editor de notas + galeria de fotos

### FASE 4: Alertas, calendario y notificaciones (Dias 17-21)
- [ ] Integracion completa Evolution API: envio de alertas Wapp
- [ ] Panel de configuracion de alertas (que notificaciones activar)
- [ ] Sync bidireccional con Google Calendar
- [ ] Firebase FCM: push notifications en tablet
- [ ] Sistema de alertas criticas (fiebre, signos de alarma)
- [ ] Exportar bitacora a PDF

### FASE 5: PWA, QA y deploy final (Dias 22-26)
- [ ] Configurar next-pwa (manifest, service worker, icons)
- [ ] Pruebas en tablet real (portrait + landscape)
- [ ] Ajustes de UI para pantalla grande
- [ ] Optimizacion de rendimiento (lazy loading, cache)
- [ ] Pruebas de alertas Wapp reales
- [ ] Pruebas de notificaciones FCM en tablet
- [ ] Deploy final en Railway con dominio
- [ ] Instalar PWA en tablet y validar funcionamiento

---

## 14. COMANDOS PARA CLAUDE CODE

Copia y pega estos prompts directamente en Claude Code (VS Code) para implementar cada parte:

### Setup inicial
```
Crea un proyecto Next.js 14 con TypeScript, Tailwind CSS y App Router.
Instala estas dependencias: mongoose, next-auth, zustand, recharts, 
shadcn/ui, node-cron, googleapis, next-pwa.
Configura el archivo next.config.js para PWA y crea el manifest.json
con tema rosa para app de seguimiento de bebe.
```

### Modelos MongoDB
```
Crea los modelos Mongoose en la carpeta /models con TypeScript para:
Baby, Feeding (tomas de leche), Diaper (panales), Sleep (sueno),
Medication (medicamentos mama y bebe), MomLog (registros mama post-cesarea),
Event (citas medicas), Note (bitacora).
Usa los schemas definidos en el BLUEPRINT.md seccion 6.
```

### API de tomas de leche
```
Implementa /app/api/feed/route.ts con Next.js App Router.
GET: retorna las ultimas 20 tomas con paginacion (?limit&page).
POST: registra nueva toma con campos: type (breast_left/breast_right/formula/mixed),
startTime, endTime, durationMinutes, amountMl, notes.
Usa el modelo Feeding de Mongoose. Incluye manejo de errores y validacion de campos.
```

### Componente registro de toma rapida
```
Crea el componente /components/bebe/FeedForm.tsx para tablet.
Debe tener: 4 botones grandes (Pecho Izq, Pecho Der, Formula, Mixto),
un cronometro que inicia al tocar el boton y se detiene con otro tap,
campo de ml para formula, y boton de guardar.
Usa Tailwind CSS con colores pastel y botones extra grandes (min 80px)
para facilitar el uso con una sola mano. Llama a POST /api/feed al guardar.
```

### Modulo medicamentos con alertas
```
Crea el modulo de medicamentos en /app/(dashboard)/mama/medicamentos/page.tsx.
Muestra lista de medicamentos activos con: nombre, dosis, proxima toma
(cuenta regresiva en tiempo real), boton "Tome ahora" (actualiza lastTaken
y calcula nextDue = lastTaken + frequencyHours).
Al guardar una toma, llama a POST /api/alerts/wapp para confirmar via WhatsApp.
Usa shadcn/ui Card y Badge para el diseño.
```

### Integracion Evolution API WhatsApp
```
Crea lib/evolution-api.ts con las funciones:
- sendWhatsAppAlert(number, message): envia mensaje de texto
- sendFeedingAlert(lastFeedTime, nextFeedTime): alerta de proxima toma
- sendMedicationAlert(medicationName, dose): alerta de medicamento
- sendCriticalAlert(message): alerta urgente con prefijo de emergencia
Usa process.env.EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE.
Luego crea /app/api/alerts/wapp/route.ts que llame a estas funciones.
```

### Dashboard principal
```
Crea el dashboard en /app/(dashboard)/page.tsx para tablet.
Muestra en tarjetas: ultima toma hace X minutos, proxima toma en X minutos,
panales hoy (# pipi, # caca), sueno total ultimas 24h, medicamento proximo,
proxima cita medica. Agrega boton flotante de accion rapida (FAB) para
registrar toma rapidamente. Usa Recharts para mini-grafica de tomas del dia.
Disena para pantalla de 10 pulgadas en landscape.
```

### Calendario Google sincronizado
```
Implementa la sincronizacion con Google Calendar.
1. Configura NextAuth con scope calendar.events en /app/api/auth/[...nextauth]/route.ts
2. Crea lib/google-calendar.ts con funciones createEvent, listEvents, deleteEvent
   usando la libreria googleapis.
3. Crea /app/api/calendar/sync/route.ts que lea eventos de Google Cal y los
   guarde en MongoDB.
4. Crea el componente CalendarView.tsx con vista mensual usando shadcn/ui Calendar.
```

### Graficas de crecimiento
```
Crea la pagina /app/(dashboard)/bebe/crecimiento/page.tsx con:
- Grafica de peso (gramos) a lo largo del tiempo usando Recharts LineChart
- Grafica de talla (cm) a lo largo del tiempo
- Formulario para agregar nueva medicion (peso + talla + fecha)
- Tabla de historial de mediciones
- Comparativa con percentiles WHO (hardcodea los valores promedio de 0-12 meses)
Llama a GET /api/stats/growth para obtener los datos.
```

### Cron jobs recordatorios
```
Crea lib/cron-jobs.ts con node-cron que se ejecute cada 15 minutos.
Funciones a implementar:
- checkFeedingAlerts(): si la ultima toma fue hace mas de la frecuencia
  configurada, enviar alerta Wapp via Evolution API
- checkMedicationAlerts(): si nextDue <= now + 15min, enviar alerta Wapp
- checkAppointmentAlerts(): si hay cita en 24h o 1h, enviar alerta Wapp
Importa e inicializa los cron jobs en /app/api/cron/route.ts
con una ruta que Railway pueda hacer ping para iniciarlos.
```

### PWA y service worker
```
Configura la app como PWA instalable en tablet Android.
1. Instala next-pwa: npm install next-pwa
2. Actualiza next.config.js con la configuracion de next-pwa
3. Crea public/manifest.json con name, icons, display standalone, 
   theme_color rosa (#ec4899)
4. Crea los iconos en /public/icons/ de 192x192 y 512x512 (usa una imagen
   de bebe como placeholder o emoji bebe convertido a PNG)
5. Verifica con Lighthouse que pasa los criterios de PWA instalable
```

---

## 15. CHECKLIST DE LANZAMIENTO

### Antes de deploy en Railway
- [ ] `.env.local` completo con todas las variables
- [ ] `.env.example` actualizado (sin valores reales)
- [ ] `.gitignore` incluye `.env.local` y `/node_modules`
- [ ] Build local exitoso (`npm run build` sin errores)
- [ ] TypeScript sin errores (`npm run type-check`)
- [ ] ESLint sin warnings criticos (`npm run lint`)

### Configuracion Railway
- [ ] Todas las variables de entorno cargadas en Railway Dashboard
- [ ] `NEXTAUTH_URL` apunta al dominio Railway (no localhost)
- [ ] MongoDB Atlas: IP de Railway en whitelist (o 0.0.0.0/0 para dev)
- [ ] Google OAuth: URI de Railway agregada en Google Cloud Console
- [ ] Evolution API accesible desde Railway (sin CORS bloqueado)

### Pruebas funcionales
- [ ] Login con Google funciona
- [ ] Registrar toma de leche y verla en el historial
- [ ] Registrar medicamento y que aparezca cuenta regresiva
- [ ] Enviar alerta de prueba a WhatsApp via Evolution API
- [ ] Crear cita y verla en Google Calendar
- [ ] Recibir notificacion push en el tablet
- [ ] Instalar PWA en tablet desde Chrome
- [ ] App funciona en modo offline (datos cacheados)
- [ ] UI se ve bien en modo landscape (10 pulgadas)

### Seguridad
- [ ] Rutas API protegidas con verificacion de sesion NextAuth
- [ ] MongoDB URI con usuario y password (no admin)
- [ ] Evolution API Key no expuesta en el cliente
- [ ] HTTPS activo en Railway (automatico con su dominio)

---

## NOTAS FINALES

**Desarrollado con Claude Code en VS Code**  
Para empezar: abre este archivo, lee cada seccion, y usa los prompts
de la seccion 14 para pedirle a Claude que implemente cada modulo.

**Orden recomendado de desarrollo:**
1. Setup inicial + MongoDB schemas
2. API Routes basicas (feed, meds, mom)
3. Dashboard + formulario de toma rapida
4. Alertas WhatsApp (Evolution API)
5. Calendario Google
6. PWA + instalar en tablet
7. Pulir UI y notificaciones FCM

**Repositorio:** github.com/jhonjagm/PC_of (rama: claude/baby-care-tracking-app-AfYC7)  
**Deploy:** Railway  
**Fecha de inicio:** 2026-04-02
