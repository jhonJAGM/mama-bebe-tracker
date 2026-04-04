# Mamá & Bebé Tracker 👶

PWA instalable para seguimiento integral de bebé recién nacida y mamá post-cesárea.

**Stack:** Next.js 14 · MongoDB Atlas · Railway · Evolution API (WhatsApp) · Google Calendar

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores (mínimo: MONGODB_URI)

# 3. Levantar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Configuración MongoDB Atlas (base de datos)

### Paso 1 — Crear cluster gratuito

1. Ir a [cloud.mongodb.com](https://cloud.mongodb.com) → **Create account** (gratis)
2. **Create a deployment** → elegir **M0 Free** (512 MB, suficiente para esta app)
3. Región: elegir la más cercana (ej. `aws / sa-east-1` para Sudamérica)
4. Nombre del cluster: `mama-bebe-cluster`

### Paso 2 — Crear usuario de base de datos

1. **Database Access** → **Add New Database User**
2. Authentication: **Password**
3. Username: `mama-bebe-user` · Password: generar uno seguro y guardarlo
4. Role: **Atlas admin** (o `readWriteAnyDatabase`)

### Paso 3 — Permitir acceso desde Railway

1. **Network Access** → **Add IP Address**
2. Hacer clic en **Allow Access from Anywhere** (`0.0.0.0/0`)
   > Railway usa IPs dinámicas, por eso se abre a todos. La seguridad la da el usuario+contraseña.

### Paso 4 — Obtener la URI de conexión

1. **Database** → **Connect** → **Drivers**
2. Copiar la URI, reemplazar `<password>` con la contraseña del paso 2
3. Reemplazar `myFirstDatabase` con `mama-bebe-tracker`

```
mongodb+srv://mama-bebe-user:TU_PASSWORD@mama-bebe-cluster.xxxxx.mongodb.net/mama-bebe-tracker?retryWrites=true&w=majority
```

---

## Deploy en Railway

### Paso 1 — Crear proyecto

1. Ir a [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → conectar tu repositorio
3. Railway detecta automáticamente Next.js y ejecuta `npm run build`

### Paso 2 — Configurar variables de entorno

1. En tu proyecto Railway → pestaña **Variables**
2. Copiar el contenido de `.env.example` y completar cada variable:

```
MONGODB_URI           = (URI de MongoDB Atlas del paso anterior)
AUTH_SECRET           = (genera: openssl rand -base64 32)
NEXTAUTH_URL          = https://TU-APP.railway.app
GOOGLE_CLIENT_ID      = (de Google Cloud Console)
GOOGLE_CLIENT_SECRET  = (de Google Cloud Console)
EVOLUTION_API_URL     = (URL de tu Evolution API)
EVOLUTION_API_KEY     = (tu API key)
EVOLUTION_INSTANCE    = mama-bebe-bot
WHATSAPP_ALERT_PHONE  = (número con código de país, sin +)
```

### Paso 3 — Configurar dominio personalizado (opcional)

1. Railway → **Settings** → **Domains** → **Generate Domain**
2. Te da un dominio tipo `mama-bebe.railway.app`
3. Actualiza `NEXTAUTH_URL` con ese dominio

### Paso 4 — Deploy automático

Cada `git push` a `main` dispara un nuevo deploy automáticamente.

Para ver logs: Railway → tu servicio → **Deployments** → clic en el deploy

---

## Configurar Google OAuth (login)

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://TU-APP.railway.app/api/auth/callback/google` (producción)
5. Copiar **Client ID** y **Client Secret** → agregar a Railway Variables

---

## Instalar la PWA en tablet Android Chrome

La app funciona como app nativa instalada directamente desde Chrome, sin necesidad de Play Store.

### Método 1 — Banner automático de Chrome

Chrome muestra automáticamente un banner de instalación cuando:
- La app tiene manifest.json válido ✅
- Hay un Service Worker registrado ✅
- La app fue visitada al menos dos veces

Tocar **"Agregar a pantalla de inicio"** cuando aparezca el banner.

### Método 2 — Instalación manual

1. Abrir Chrome en la tablet y navegar a `https://TU-APP.railway.app`
2. Tocar los **tres puntos** (⋮) en la esquina superior derecha
3. Seleccionar **"Agregar a pantalla de inicio"** o **"Instalar app"**
4. Confirmar → la app aparece como ícono en la pantalla de inicio

### Uso offline

Una vez instalada, las páginas principales (`/`, `/bebe`, `/mama`, `/calendario`, `/bitacora`) funcionan sin internet gracias al Service Worker. Los datos nuevos se sincronizan al recuperar la conexión.

---

## Variables de entorno mínimas para funcionar

Para el uso básico (sin WhatsApp ni Google Calendar):

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=secreto-aleatorio
NEXTAUTH_URL=https://tu-app.railway.app
```

El resto de las funcionalidades se activan a medida que se configuran las integraciones.

---

## Comandos útiles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción (prueba local antes de deploy)
npm run start    # Inicia el servidor de producción en local
npm run lint     # Verificar errores de TypeScript/ESLint
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (dashboard)/       # Todas las páginas autenticadas
│   │   ├── page.tsx        # Dashboard principal
│   │   ├── bebe/           # Tomas, pañales, sueño, crecimiento
│   │   ├── mama/           # Recuperación post-cesárea
│   │   ├── calendario/     # Sync Google Calendar
│   │   └── bitacora/       # Notas y fotos
│   └── api/                # API routes REST
├── components/
│   ├── bebe/               # Formularios y gráficas del bebé
│   ├── mama/               # Formulario de recuperación mamá
│   ├── dashboard/          # Tarjetas stats, alertas
│   └── shared/             # TabletNav, ServiceWorkerRegistration
├── lib/                    # Helpers: mongodb, dashboard-data, mom-data
└── models/                 # Schemas Mongoose
public/
├── sw.js                   # Service Worker (offline)
├── manifest.json           # PWA manifest
└── icons/                  # Íconos de la app
```
