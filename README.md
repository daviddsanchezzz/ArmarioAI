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
- [Supabase CLI](https://supabase.com/docs/guides/local-development) y Docker para la base de datos local
- Expo Go o un simulador para la app

## Arrancar en local

```bash
pnpm install

# 1. Supabase local: Postgres, Auth y Storage, con las migraciones aplicadas
pnpm db:start          # muestra la URL, la anon key y la service_role key

# 2. API
cp apps/api/.env.example apps/api/.env      # rellena las claves del paso 1
pnpm --filter @armario/shared build
pnpm --filter @armario/api dev              # http://localhost:4000

# 3. App
cp apps/mobile/.env.example apps/mobile/.env  # URL y anon key de Supabase, URL de la API
pnpm --filter @armario/mobile start
```

En un móvil físico, `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_SUPABASE_URL` deben usar la IP de tu ordenador en la red local, no `localhost`.

## Comandos

```bash
pnpm typecheck   # TypeScript en todos los paquetes
pnpm lint        # ESLint de la app
pnpm test        # tests de shared y de la API
pnpm db:reset    # recrea la base local y vuelve a aplicar las migraciones
pnpm db:types    # regenera los tipos de la base de datos
```

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

## Despliegue de la API

`apps/api/Dockerfile` se construye desde la raíz del repo (`docker build -f apps/api/Dockerfile .`). En Railway o Render, apunta el servicio a ese Dockerfile y configura las variables de `apps/api/.env.example`. Para producción, aplica las migraciones con `supabase link` y `supabase db push`.

## Fases

1. **Estructura, auth, CRUD de prendas y subida con URL firmada** ← aquí estamos
2. Pipeline asíncrono: quitar fondo, recortar y etiquetar con IA
3. Pantallas: guía de cámara, detalle y edición
4. Creador de outfits y calendario
5. Sugerencias con IA
6. Probador virtual
