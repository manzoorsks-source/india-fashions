# India Fashions — Luxury Handcrafted Ethnic E-Commerce Platform

A production-grade, full-stack luxury saree and festive ethnic wear boutique e-commerce web application featuring real-time inventory matrix management, dynamic festive campaign scheduling, 2+1 promotional bundling with cost safeguards, advance booking with token allocation, and multi-role administrative controls.

---

## 🌟 Key Features

### 🛍️ Customer Experience
- **Royal Heritage Aesthetics**: Tailored Emerald Green (`#0F5F56`), Royal Crimson, and Gold (`#D4AF37`) luxury visual design with subtle micro-interactions.
- **Dynamic Festive Campaigns**: Countdown timers, scheduled festive sales (From Date to To Date), and automated banner visibility upon expiration.
- **2+1 Festive Bundle Offer**: Buy 2 luxury sarees, get 1 complimentary with profit-margin cost safeguards.
- **Advance Booking & Loom Reservations**: Reserve exclusive weave masterworks with nominal token advances.
- **Comprehensive Checkout**: COD, UPI, Netbanking/IMPS/NEFT with UTR bank verification, and credit/debit card support.

### 🛡️ Admin & Operational Matrix
- **Inventory Matrix & Stock Intake**:
  - Dual-mode stock management: Restock existing catalogue SKUs or add brand-new articles directly from the inventory screen.
  - Uncapped stock addition ($1$ to $\infty$) with strict negative-inventory prevention on client and server.
  - Low-stock threshold alerts and audit movements tracking.
- **Festive Campaign Manager**:
  - Create, schedule, edit, enable/disable, and delete festive sales campaigns with live countdown tickers.
- **Role-Based Access Control (RBAC)**:
  - Super Admin (Owner), Admin / Store Manager, Inventory Executive, Head Cashier, and Customer Service.
  - Cost price masking safeguards for non-administrative roles.
- **Live Brand Customization**:
  - Boutique physical address, delivery radius (km), brand name, and announcement tickers customizable on the fly.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Vanilla CSS Design System
- **Backend API**: Node.js, Express, TypeScript (`tsx`)
- **Database**: SQLite (via `sql.js`) with ACID transactions
- **Authentication**: Role-based session authentication with HTTP-only cookies

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/manzoorsks-source/india-fashions.git
cd india-fashions

# Install dependencies
npm install

# Seed the database
npm run seed

# Run local development server (Client + Server concurrently)
npm run dev
```

The application will be accessible at:
- **Client App**: [http://localhost:5173](http://localhost:5173)
- **Express API**: [http://localhost:3001/api](http://localhost:3001/api)

---

## 🔐 Default Admin Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Super Admin (Shop Owner)** | `owner@indiafashions.com` | `password123` | Full boutique access, settings, RBAC, cost prices |
| **Admin / Store Manager** | `manager@indiafashions.com` | `password123` | Catalog, media, inventory, sales campaigns |
| **Inventory Executive** | `inventory@indiafashions.com` | `password123` | Stock intake, loom restock receipts, threshold alerts |
| **Head Cashier** | `cashier@indiafashions.com` | `password123` | IMPS/NEFT bank UTR payment approval, order processing |

---

## 📦 Production Build

```bash
npm run build
```
Generates optimized static assets in `/dist`.
