# Prompt 15

## User Input
```text
Configure this repository to deploy on Vercel as a project with multiple services.

Here is a suggested vercel.json to add to the repo root directory, auto-detected from the repository layout. Treat it as a starting point, not a finished answer:

{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "app": {
      "root": ".",
      "framework": "vite"
    },
    "backend": {
      "root": "backend",
      "framework": "django"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": {
        "service": "backend"
      }
    },
    {
      "source": "/(.*)",
      "destination": {
        "service": "app"
      }
    }
  ]
}

1. Add bindings for internal services. Any service that calls another service should use a binding, declared on the calling service.
2. Update the application code to match the routing and bindings.
3. Confirm the details with me before you finish.
i am hosting this in the vercel if possible both django and the react
```
*(User attached Vercel dashboard screenshot `uploaded_media_1794742866046.jpg` showing auto-detected services `backend` (Django @ `/api`) and `app` (Vite @ `/`))*

---

## Architectural Objectives & Implementations

1. **Created Root `vercel.json` with Services and Service Binding**:
   - `services.app`: root `.` with `framework: "vite"` and internal binding to `backend` injecting `BACKEND_URL`.
   - `services.backend`: root `backend` with `framework: "django"`.
   - `rewrites`:
     - `/api/(.*)` -> `{ "service": "backend" }`
     - `/(.*)` -> `{ "service": "app" }`
2. **Updated Application Code**:
   - Replaced hardcoded `http://127.0.0.1:8000` calls in `DiscoveryView.tsx` and `VirtualLabView.tsx` with relative path `/api/...` and `import.meta.env.VITE_BACKEND_URL || ''`.
   - Configured `vite.config.ts` dev server proxy to forward `/api` calls to `process.env.BACKEND_URL || 'http://127.0.0.1:8000'` so local development and `vercel dev` work out of the box without code modifications.
   - Enhanced `wsgi.py` and `asgi.py` with `app = application` for serverless WSGI/ASGI entrypoint compatibility.
   - Updated `settings.py` CORS configuration to allow `.vercel.app` domains (`CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.vercel\.app$"]`).
3. **Verification**:
   - `npm run lint` & `npm run build`: 0 TypeScript errors, 2056 modules transformed, built in 2.36s.
   - `python manage.py test api`: 30/30 tests passed.
   - `python manage.py collectstatic --noinput`: 154 files copied cleanly.
