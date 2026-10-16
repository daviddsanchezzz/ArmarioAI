# Armario

App mobile-first para gestionar tu ropa con IA.

| Carpeta | Qué es |
|---|---|
| `apps/mobile` | App Expo (Expo Router, TanStack Query, Zustand) |
| `apps/api` | API Node + Express + TypeScript |
| `packages/shared` | Esquemas Zod y tipos compartidos por app y API |
| `supabase` | Configuración local y migraciones SQL (con RLS) |

## Requisitos

- Node 22 y pnpm 10 (`corepack enable`)
- Un proyecto de [Supabase](https://supabase.com) en la nube (no hace falta Docker)
- Expo Go o un simulador para la app

## Arrancar en desarrollo

```bash
pnpm install

# 1. Base de datos: enlaza tu proyecto de Supabase y aplica las migraciones
pnpm db:link           # pide el project ref y la contraseña de la base
pnpm db:push

# 2. API
cp apps/api/.env.example apps/api/.env      # SUPABASE_URL, anon key y service_role key
pnpm --filter @armario/shared build
pnpm --filter @armario/api dev              # http://localhost:4000

# 3. App
cp apps/mobile/.env.example apps/mobile/.env  # URL y anon key de Supabase, URL de la API
pnpm --filter @armario/mobile start
```

Las claves están en Supabase, en Project Settings → API. En un móvil físico, `EXPO_PUBLIC_API_URL` debe usar la IP de tu ordenador en la red local (o la URL de Railway), no `localhost`.

## Comandos

```bash
pnpm typecheck   # TypeScript en todos los paquetes
pnpm lint        # ESLint de la app
pnpm test        # tests de shared y de la API
pnpm db:push     # aplica migraciones nuevas al proyecto enlazado
pnpm db:types    # regenera los tipos de la base de datos
```

## Despliegue

| Pieza | Dónde | Configuración |
|---|---|---|
| Base de datos, Auth y Storage | Supabase | `pnpm db:push` |
| API | Railway | `apps/api/railway.json` |
| App web | Vercel | `apps/mobile/vercel.json` |
| App iOS/Android | EAS (Expo) | `eas build` cuando toque |

**Railway (API).** Crea un servicio desde este repo con *Root Directory* vacío (la raíz del monorepo) y *Config File Path* `/apps/api/railway.json`. Añade las variables de `apps/api/.env.example` con `NODE_ENV=production`, y en `CORS_ORIGINS` pon el dominio de Vercel. Railway define `PORT` solo.

**Vercel (web).** Importa el repo con *Root Directory* `apps/mobile`. Añade las tres variables `EXPO_PUBLIC_*`, con `EXPO_PUBLIC_API_URL` apuntando a la URL pública de Railway.

## Cómo encaja

- La app usa Supabase solo para la sesión y para subir fotos a una URL firmada. Todo lo demás pasa por la API.
- La API verifica el JWT de Supabase y consulta la base con el token del usuario, así que RLS se aplica también en el backend. La clave `service_role` solo se usa para procesar prendas y para borrar la cuenta.
- Las fotos viven en el bucket privado `garments`, en `{userId}/{garmentId}/original.jpg`. La base guarda rutas y la API devuelve URLs firmadas que caducan.

### Endpoints

```
GET    /health
POST   /garments/upload-url   → { garmentId, path, signedUrl, token }
POST   /garments              { garmentId, ...etiquetas }
GET    /garments?category=&color=&season=&limit=&cursor=
GET    /garments/:id
PATCH  /garments/:id
DELETE /garments/:id
GET    /me
DELETE /me                    borra cuenta, prendas y fotos
```

## Fases

1. **Estructura, auth, CRUD de prendas y subida con URL firmada** ← aquí estamos
2. Pipeline asíncrono: quitar fondo, recortar y etiquetar con IA
3. Pantallas: guía de cámara, detalle y edición
4. Creador de outfits y calendario
5. Sugerencias con IA
6. Probador virtual
