# Easyshop

A three-tier electronics store built with **Node.js (Express)** and **MySQL**.

## Architecture

```
┌────────────────────┐   HTTP/JSON   ┌──────────────────────────────┐   SQL   ┌─────────┐
│ 1. PRESENTATION    │ ────────────▶ │ 2. APPLICATION               │ ──────▶ │ 3. DATA │
│ public/ (HTML/CSS/ │               │ routes → controllers →       │         │ MySQL   │
│ JS single page UI) │ ◀──────────── │ services → repositories      │ ◀────── │ easyshop│
└────────────────────┘               └──────────────────────────────┘         └─────────┘
```

| Tier | Location | Responsibility |
|------|----------|----------------|
| Presentation | `public/` | Product browsing, search, filters, cart (localStorage), checkout form |
| Application  | `src/routes`, `src/controllers`, `src/services` | REST API, validation, business rules |
| Data         | `src/repositories`, `src/config/db.js`, `database/schema.sql` | All SQL, connection pool, transactions |

## Prerequisites
- Node.js 18+
- MySQL 8+ (running locally or remotely)

## Setup

```bash
npm install
cp .env.example .env        # then edit DB_USER / DB_PASSWORD
npm run db:init             # creates the `easyshop` database, tables and sample data
npm start                   # http://localhost:3000
```

(Alternatively load `database/schema.sql` yourself: `mysql -u root -p < database/schema.sql`.)

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | Categories with product counts |
| GET | `/api/products` | List. Query: `search`, `category`, `minPrice`, `maxPrice`, `sort` (`price_asc`, `price_desc`, `name`, `newest`), `page`, `limit` |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product (409 if it appears in orders) |
| POST | `/api/orders` | Place order |
| GET | `/api/orders/:id` | Order with line items |
| GET | `/api/orders?email=` | Orders for a customer email |

Example order:

```bash
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{
  "name": "Asha Patil", "email": "asha@example.com", "phone": "9999999999",
  "address": "12 MG Road, Pune 411001",
  "items": [{ "productId": 3, "quantity": 1 }, { "productId": 8, "quantity": 2 }]
}'
```

Checkout runs in one MySQL transaction: rows are locked with `SELECT … FOR UPDATE`, stock is verified, the order and items are inserted and stock is decremented. Any failure rolls everything back, so stock never goes negative.

## Project structure

```
easyshop/
├── database/schema.sql
├── public/            (index.html, style.css, app.js)
└── src/
    ├── app.js  server.js
    ├── config/db.js
    ├── routes/  controllers/  services/  repositories/
    ├── middleware/errorHandler.js
    └── scripts/initDb.js
```

## Notes before going to production
- Product create/update/delete endpoints are **not authenticated** — add login and an admin role (e.g. JWT) before exposing them publicly.
- Add rate limiting and `helmet`, and serve over HTTPS.
- Payments are not integrated; orders are created with status `PENDING`.
# Easyshop
