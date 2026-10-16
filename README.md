# FreshHarvest (Farm-to-Consumer Marketplace) 🌾

FreshHarvest is a modern, full-stack, direct-from-farm marketplace web application that eliminates middlemen, ensures 82%+ direct payouts to farmers, guarantees farm-to-table delivery within 24 hours, and enables conscious consumers and bulk institutional buyers to purchase vine-ripened organic produce with complete transparency.

---

## 🌟 Key Features

1. **Farmer Hub & Control Center (விவசாயி மையம்)**:
   - **Direct Camera & Photo Upload**: Snap photos of freshly harvested crops straight from mobile camera or gallery with real-time preview and 10MB upload support.
   - **12 One-Tap Crop Presets (விரைவுத் தேர்வு)**: Auto-fill details for popular crops (Tomatoes, Small Onions, Potatoes, Carrots, Bananas, Ponni Rice, A2 Cow Milk, Turmeric, Spinach, etc.) in a single tap.
   - **Bilingual Tamil + English Guidance**: Simple, culturally accessible labels and cues for farmers in rural agricultural clusters.
   - **Live Order Packing & Payout Tracking**: Simple one-click order progression (`[Accept Order]` -> `[Mark Packed]` -> `[Ready for Fleet]`) with direct customer calling.
   - **Surplus & Anti-Waste Engine**: List unsold bumper crops at 15–40% discounts to prevent farm-gate post-harvest losses.

2. **Consumer Direct-From-Farm Marketplace**:
   - Vine-ripened organic catalog filtered by farm category and district origin.
   - Farm story badges, certified organic credentials, and transparent pricing breakdowns.
   - Seamless cart, multi-address delivery management, and flexible checkout (UPI, Cards, Cash-on-Delivery).
   - Dedicated Support & Complaints Desk (`/support`) with ticket tracking.

3. **B2B Bulk Buyer Hub**:
   - Institutional requisitions for restaurants, hotels, hostels, and supermarkets.
   - Tiered volume discounting and custom delivery scheduling.

4. **Delivery Partner Fleet Logistics**:
   - Fleet route management, milestone checkpoint tracking, and live order status synchronization.

5. **Admin Governance & Care Desk**:
   - Platform analytics, grower verifications, dispute resolution, and audit logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Vanilla CSS with responsive design system.
- **Backend**: Node.js, Express 4, Mongoose 8, JWT Authentication, bcryptjs.
- **Database**: MongoDB Atlas Cloud (`freshharvest` cluster with 12 active collections).

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/arunpcse/Farm-to-Consumer.git
cd Farm-to-Consumer
```

### 2. Configure Backend Environment

In the `backend/` directory, create a `.env` file (or copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.fxkr3nn.mongodb.net/freshharvest?retryWrites=true&w=majority
JWT_SECRET=freshharvest_super_secure_jwt_secret_key_2026
```

### 3. Install & Start Backend

```bash
cd backend
npm install
npm run dev
```

* Backend runs at: `http://localhost:5000`
* Live Health Check: `http://localhost:5000/api/health`

### 4. Install & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

* Frontend runs at: `http://localhost:5173` (or `http://localhost:5174`)

---

## 🔑 Demo & Testing Credentials

Log in at `/login` using any of the following pre-configured accounts:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@freshharvest.in` | `password123` | `/farmer-dashboard` |
| **Consumer** | `customer@freshharvest.in` | `password123` | `/products` & `/orders` |
| **Bulk Buyer** | `bulkbuyer@freshharvest.in` | `password123` | `/bulk-buyer` |
| **Delivery Fleet** | `delivery@freshharvest.in` | `password123` | `/deliveries` |
| **Admin** | `admin@freshharvest.in` | `admin123` | `/admin` |

---

## 🧪 Testing & Verification

Run the automated integration and multi-role verification suite:

```bash
cd backend
npm test
node tests/verify_full_system.js
```

---

## 📄 License

MIT License. Designed and developed for empowering organic farmers and conscious consumers.
