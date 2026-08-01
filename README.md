# PlantPanda 🌿

A full-stack plant delivery marketplace MVP with live GPS tracking, geofenced dynamic
driver dispatch, multi-tenant branch/nursery portals, and a Cash-on-Delivery reconciliation
ledger between riders and businesses.

This ZIP contains three independent projects:

```
plantpanda/
├── backend/        Node.js + Express + TypeScript API (MongoDB, Redis, Socket.io)
├── web-portal/      React (Vite) + Tailwind — Super Admin & Business (branch/nursery) portals
└── mobile-app/       Expo (React Native) + NativeWind — shared Customer/Rider app
```

---

## 1. Backend Setup

```bash
cd backend
cp .env.example .env      # fill in MONGO_URI, REDIS_URL, JWT_SECRET, GOOGLE_MAPS_API_KEY, etc.
npm install
npm run seed               # creates a super admin, sample nursery, rider, and customer
npm run dev                 # starts the API on http://localhost:5000
```

Demo accounts created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@plantpanda.com | admin1234 |
| Nursery | nursery@plantpanda.com | nursery1234 |
| Rider | rider@plantpanda.com | rider1234 |
| Customer | customer@plantpanda.com | customer1234 |

You need a running **MongoDB** instance (Atlas or local) and a running **Redis** instance
(Redis Cloud or local `redis-server`) before starting the API.

### Core backend design decisions (read this before demoing)

- **Dispatch engine** (`src/services/dispatchService.ts`): when a business marks an order
  `ready_for_pickup`, Redis `GEOSEARCH` finds online riders within 5km, broadcasts
  `order:available` to all of them, and the first `order:accept` wins via a Redis `SET NX`
  lock. If nobody accepts within 180 seconds, the radius auto-expands to 8km.
- **Money split on every order**: `itemsTotal` (product value), `deliveryFee` (rider's own
  per-km earning), and `commissionAmount` (platform's cut) are calculated once at order
  creation and never mixed:
  - `deliveryFee = baseFee + distanceKm × perKmRate` — both configurable by the Super Admin
    under Platform Settings.
  - `commissionAmount = itemsTotal × business.commissionRate` — **visible to Super Admin
    only**. It's stripped out of every response sent to business and rider portals at the
    controller level (`NURSERY_HIDDEN_FIELDS` in `models/Order.ts`), not just hidden in the UI.
- **COD cash ledger** (`src/services/ledgerService.ts` + `models/CashLedger.ts`): on delivery,
  `itemsTotal` (never `deliveryFee`, never commission) is added to a `CashLedger` document
  scoped to `(riderId, businessId)`. Business staff record settlements via
  `POST /ledger/:ledgerId/settle`, which decrements the same document the rider reads — so
  "Rs 500 received, Rs 500 left" is always identical on both dashboards.
  - **Global block rule**: if a rider's outstanding balance to **any single** business
    reaches the global threshold (default Rs 5,000, configurable by Super Admin), the rider
    is blocked from accepting **any** order platform-wide — enforced both when they try to
    go online (`POST /riders/online`) and again at the dispatch/claim layer, so a rider who
    goes online just under the wire can't sneak past it mid-shift.
- **Dual PIN verification**: `pickupPIN` (business confirms rider) and `deliveryPIN`
  (customer confirms rider) are generated at order creation and checked server-side before
  each status transition.

---

## 2. Web Portal Setup (Super Admin + Business Portal)

```bash
cd web-portal
cp .env.example .env       # point VITE_API_URL / VITE_SOCKET_URL at your backend
npm install
npm run dev                  # http://localhost:5173
```

- `/login`, `/register` — auth, with a branch/nursery signup flow that lands in "pending
  approval" until the Super Admin approves it.
- `/admin/*` — Super Admin: dashboard, approvals (businesses + riders), commission summary
  (Super Admin only, per-business), analytics, and platform settings (per-km rate, base fee,
  global COD threshold, dispatch radius/timeout tuning).
- `/business/*` — Branch/Nursery: overview, inventory (CRUD + availability toggle), order
  pipeline (accept → ready → verify pickup PIN), live tracking of assigned riders, and the
  **Rider Cash Ledger** page for recording settlements.

---

## 3. Mobile App Setup (Customer + Rider, shared codebase)

```bash
cd mobile-app
cp .env.example .env    # if you add one; otherwise edit apiUrl/socketUrl in app.json "extra"
npm install
npx expo start
```

Scan the QR code with Expo Go, or run `npm run ios` / `npm run android` with a simulator.

- **Customer Mode**: browse nearby plants (uses device GPS), cart, checkout (COD), order
  history, and a dual-phase live tracking screen (Phase 1: rider → nursery, Phase 2: nursery
  → customer, polyline switches automatically on the `order:phaseChange` socket event).
- **Rider Mode**: toggle in the Profile tab (only shown to accounts registered as `rider`).
  Includes online/offline switch (blocked if COD debt ≥ threshold), the instant dispatch
  modal, turn-by-turn pickup/delivery flow with PIN entry and an optional proof-of-delivery
  photo, ride history, earnings (delivery fees only), and the Cash Balances screen showing
  exactly what's owed per business — symmetric with the business portal's ledger.

> **Note on architecture:** the original brief mentioned Expo Router; this build uses
> React Navigation (stack + bottom tabs) instead, since it's more reliable to hand-assemble
> correctly without a live Metro bundler to verify against. The screen/route structure maps
> 1:1 either way if you'd prefer to port it to Expo Router later.

---

## Suggested demo flow

1. Seed the backend, log into the web portal as Super Admin → approve nothing needed yet
   (seed data is pre-approved).
2. Log into the web portal as the nursery (`nursery@plantpanda.com`), open **Orders**.
3. In the mobile app, register/login as a customer, browse the seeded nursery's plants, add
   to cart, checkout.
4. Back in the nursery portal, **Accept** the order, then **Mark Ready for Pickup** — this
   fires the Redis dispatch broadcast.
5. In the mobile app, switch to Rider Mode (or log in as `rider@plantpanda.com`), go online,
   accept the dispatch modal.
6. **Live GPS Tracking & Route Phase 1 (Rider → Nursery)**:
   - **Customer Map Side**: Open the order **Tracking Screen**. The customer sees the live orange **Rider Marker** moving in real time (`rider:locationUpdate` socket stream) and a green road polyline connecting the rider's live position to the **Nursery (Pickup Location)**.
   - **Rider Map Side**: The rider's app (`ActiveDeliveryScreen`) tracks device GPS via `Location.watchPositionAsync`, streams location pings, and displays the turn-by-turn road route to the Nursery along with the rider's 4-digit **Pickup PIN**.
7. Nursery portal: Click **Verify Rider Pickup PIN** and enter the 4-digit PIN shown on the rider's screen.
8. **Live Route & Map Switch (Phase 2: Nursery → Customer Drop-off)**:
   - Upon verification, the backend updates the order status to `picked_up` and emits `order:phaseChange` (`phase: 'delivery'`).
   - Both **Customer** and **Rider** map screens automatically detect the phase change (`useLiveRoute`), clearing the previous route cache and instantly recalculating the road route from the rider's current position to the **Customer's Drop-off Address**.
   - The customer continues to watch the captain's live movement on their map in real time as the rider moves toward their home.
9. Rider app: enter the customer's delivery PIN (shown on the customer's Tracking screen) to
   complete delivery — watch the Cash Balances screen update, and check the nursery's
   **Rider Cash Ledger** page shows the identical outstanding amount.
10. As Super Admin, check **Commission** — the commission earned on that order is visible
    there and nowhere else.
