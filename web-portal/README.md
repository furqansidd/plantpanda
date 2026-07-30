# PlantPanda Web Portal

React (Vite) + Tailwind CSS web app serving two portals from one codebase, gated by role:

- **Super Admin** (`/admin/*`) — global dashboard, business/rider approvals, commission
  summary (superadmin-only), platform-wide analytics, and platform settings (per-km rider
  rate, base fee, global COD block threshold, dispatch radius/timeout).
- **Branch / Nursery** (`/business/*`) — overview, inventory management, order pipeline
  (accept → ready for pickup → verify rider's pickup PIN), live tracking of assigned riders,
  and the Rider Cash Ledger (COD settlement) screen.

See the root `README.md` (one level up) for full setup instructions covering the backend and
mobile app as well.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```
