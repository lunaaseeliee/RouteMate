# RouteMate — rishii-e5383

This is the redesigned version of your actual local project from OneDrive Documents. The Firebase project used by both environment configuration and the bundled configuration is `rishii-e5383`, with its `(default)` Firestore database.

## Start

1. Run `npm ci`.
2. Run `npm start` to use the included production build, or `npm run dev` to develop.
3. Open http://localhost:3000.

If port 3000 is occupied, use PowerShell:

```powershell
$env:PORT = "3001"
npm start
```

Then open http://localhost:3001. Restart the server and refresh the browser after switching project versions.

## Rebuild

Run `npm run lint` and `npm run build` after edits. Node.js 20.19+ or 22.12+ is required. Serve the app through its server; do not open `dist/index.html` directly.

## Your existing features

The base is your local `routemate_firebase_fixed/routemate_unpacked` project. Its authentication services, email-verification gate, disabled phone onboarding, ride services, traffic-aware maps, location search, and Dijkstra utility have been preserved. The redesign adds the supplied logo, indigo/navy palette, new landing page, desktop sidebar, account layouts, and consistent responsive screens.

The included `.env.local` retains the local project's client Firebase and map settings. The bundled JSON configuration also points to the same project, preventing an accidental switch if the environment file is absent. Non-client server secrets were not copied into this deliverable.

## Validation

TypeScript and production build checks passed. Firebase configuration is verified as `rishii-e5383` / `(default)`, and the generated frontend contains no reference to the former project. Browser checks use isolated sample data for signed-in layouts and do not change cloud records. Live sign-in, email delivery, Firestore writes, and Google Maps calls need a final check with your own account.

## Street map fallback

If Google Maps is unavailable, an interactive OpenStreetMap street map displays pickup/drop-off pins and supports clicking to choose locations. OSRM supplies driving routes when reachable. If routing is unavailable, the form retains its existing estimated-distance behavior; the map labels this state. Google Maps still requires billing and the existing key configuration for its live traffic features.
