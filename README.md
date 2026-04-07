# Voice-Based Smart Billing System

Full-stack MERN application with voice recognition, shortcut decoding, GST billing, and confirmation-gated invoice generation.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm run seed        # Creates demo users + 16 sample products
npm run dev         # Starts on http://localhost:5000
```

**Demo credentials after seeding:**
| Role     | Email                     | Password     |
|----------|---------------------------|--------------|
| Admin    | admin@billing.com         | admin123     |
| Operator | operator@billing.com      | operator123  |

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start           # Starts on http://localhost:3000
```

The frontend proxies `/api` requests to `localhost:5000`.

---

## Project Structure

```
voice-billing/
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── .env.example           ← Copy to .env and configure
│   ├── models/
│   │   ├── User.js            ← Operator/Admin accounts
│   │   ├── Product.js         ← Items with shortcuts
│   │   └── Invoice.js         ← Confirmed invoices
│   ├── routes/
│   │   ├── auth.js            ← Login / Register / Me
│   │   ├── products.js        ← CRUD products
│   │   ├── voice.js           ← POST /voice/decode
│   │   ├── bill.js            ← POST /bill/calculate (GST)
│   │   ├── invoice.js         ← POST /invoice/generate (confirmation-gated)
│   │   └── dashboard.js       ← Stats endpoint
│   ├── middleware/
│   │   └── auth.js            ← JWT protect + adminOnly
│   └── utils/
│       └── seed.js            ← Demo data seeder
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js             ← Routes + auth guard
        ├── index.css          ← Global styles + CSS variables
        ├── context/
        │   └── AuthContext.js ← Login/logout state
        ├── hooks/
        │   └── useSpeech.js   ← Web Speech API hook
        ├── utils/
        │   └── api.js         ← Axios instance + interceptors
        ├── components/
        │   └── Layout.js      ← Sidebar + nav
        └── pages/
            ├── Login.js       ← Auth page
            ├── Dashboard.js   ← Stats + recent invoices
            ├── Billing.js     ← 4-step billing flow ← MAIN PAGE
            ├── Invoices.js    ← Invoice history + PDF download
            └── Products.js    ← Product catalog (admin CRUD)
```

---

## API Endpoints

| Method | Endpoint                | Auth     | Description                        |
|--------|-------------------------|----------|------------------------------------|
| POST   | /api/auth/login         | Public   | Login → returns JWT                |
| POST   | /api/auth/register      | Public   | Register new user                  |
| GET    | /api/auth/me            | JWT      | Get current user                   |
| GET    | /api/products           | JWT      | List all active products           |
| POST   | /api/products           | Admin    | Create product                     |
| PUT    | /api/products/:id       | Admin    | Update product                     |
| DELETE | /api/products/:id       | Admin    | Deactivate product                 |
| POST   | /api/voice/decode       | JWT      | Decode transcript → order array    |
| POST   | /api/bill/calculate     | JWT      | Calculate GST totals               |
| POST   | /api/invoice/generate   | JWT      | Generate invoice (confirmed:true!) |
| GET    | /api/invoice            | JWT      | List all invoices (paginated)      |
| GET    | /api/invoice/:id        | JWT      | Get single invoice                 |
| GET    | /api/dashboard/stats    | JWT      | Today/month revenue stats          |

---

## Voice Command Examples

Speak these in the Billing page:

```
"bn 2"                    → Biryani x2
"bn 2, ch 1, lsi 3"       → Biryani x2, Chicken Curry x1, Lassi x3
"vt 2 wtr 4"              → Veg Thali x2, Water x4
"pbm 1 roti 4 dal 2"      → Paneer Butter Masala, 4 Rotis, Dal x2
```

**Shortcut cheat sheet (after seeding):**

| Shortcut | Item                    | Price |
|----------|-------------------------|-------|
| bn       | Biryani                 | ₹120  |
| ch       | Chicken Curry           | ₹150  |
| pbm      | Paneer Butter Masala    | ₹160  |
| dal      | Dal Tadka               | ₹80   |
| roti     | Butter Roti             | ₹20   |
| naan     | Naan                    | ₹30   |
| lsi      | Lassi                   | ₹40   |
| wtr      | Mineral Water           | ₹20   |
| mj       | Mango Juice             | ₹60   |
| coke     | Coca Cola               | ₹40   |
| rice     | Steamed Rice            | ₹50   |
| raita    | Raita                   | ₹30   |
| gj       | Gulab Jamun             | ₹50   |
| ic       | Ice Cream               | ₹60   |
| vt       | Veg Thali               | ₹180  |
| nvt      | Non-Veg Thali           | ₹220  |

---

## Key Features

- **Voice input** using browser-native Web Speech API (no API cost)
- **Shortcut decoder** — "bn 2" → Biryani × 2
- **GST engine** — CGST+SGST (intra-state) or IGST (inter-state)
- **Confirmation gate** — invoices ONLY generated with `confirmed: true`
- **PDF invoices** — generated server-side with pdfkit
- **Role-based access** — Admin (full CRUD) vs Operator (billing only)
- **Dark UI** — professional billing terminal aesthetic

---

## Tech Stack

| Layer    | Technology                   |
|----------|------------------------------|
| Frontend | React 18, React Router 6     |
| Backend  | Node.js 20, Express 4        |
| Database | MongoDB 7, Mongoose 8        |
| Auth     | JWT + bcryptjs               |
| Voice    | Web Speech API (built-in)    |
| PDF      | pdfkit                       |
| Styling  | Custom CSS variables (dark)  |

