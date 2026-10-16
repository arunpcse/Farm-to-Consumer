# FreshHarvest — Complete Agile Scrum Plan & Jira Structure

**Project:** FreshHarvest Digital Marketplace (`freshharvest123.atlassian.net`)  
**Methodology:** Agile Scrum (4 Sprints × 2 Weeks)  
**Team Members & Roles:**
- **Arun P (24CSR027):** Product Owner & Full-Stack Developer
- **Aathavan R:** Scrum Master & Backend / Auth Lead
- **Anbarasan A:** Database Engineer & QA / Testing Lead
- **Arisudhan P (24CSR025):** UI/UX Designer & Frontend Lead

---

## 1. Executive Summary & Farmer Problem-Solution Matrix

| # | Real Farmer Problem | FreshHarvest Feature | Jira Task | How It Solves the Problem |
|---|---|---|---|---|
| 1 | **Middlemen exploitation & no direct buyer access** | Direct Farmer-Buyer Marketplace | FH-4, FH-17, FH-61 | Eliminates redundant broker layers; farmers list directly to retail & bulk consumers. |
| 2 | **Price opacity & fluctuating margins** | Transparent Pricing & Cost Breakdown | FH-12, FH-22, FH-70 | Real-time farmer-set pricing displayed transparently per kg/unit with zero hidden cuts. |
| 3 | **Bulk produce buyer discovery failure** (e.g. messes, canteens, restaurants) | Bulk Buyer Ordering & Quotation Module | FH-73, FH-76 | College hostels, restaurants, and grocery shops can place bulk requests with MOQ thresholds. |
| 4 | **Perishable produce waste / Unsold stock** | Surplus Stock & Discount Listing | FH-79 | Farmers list ripening excess yield at discounted rates with minimum batch sizes to clear stock fast. |
| 5 | **Consumer detachment from origin** | "Know Your Farmer" & Native Filtering | FH-61, FH-64, FH-67 | Consumers filter by State → District → Taluk → Village to support local native farmers. |
| 6 | **Lack of harvest date & freshness visibility** | Harvest & Availability Tracker | FH-70, FH-97 | Shows exact harvest dates, expected shelf-life window, soil type, and fertilizer details. |
| 7 | **Disorganized multi-channel orders (calls/SMS)** | Unified Farmer Order & Earnings Dashboard | FH-36, FH-85, FH-88 | Farmers accept/reject, mark preparing/ready for pickup, and review real-time revenue stats. |
| 8 | **Logistics and delivery overheads** | Hybrid Delivery & Partner Allocation | FH-43, FH-91 | Provides self-pickup, farmer local delivery, and third-party partner logistics coordination. |
| 9 | **Zero consumer feedback loop** | Verified Order Reviews & Star Ratings | FH-94 | Direct ratings and written reviews help good farmers build credibility and improve quality. |

---

## 2. Your Existing Jira Backlog vs. Sprints

### Existing Jira Items (Current Status)
- `FH-3`: Subtask 2.1 — **Done** (Arun P)
- `FH-4`: Customer Registration & Authentication — **Done** (Aathavan R)
- `FH-8`: Customer Profile — **Done** (Anbarasan A)
- `FH-12`: Product Discovery — **Done** (Arisudhan P)
- `FH-17`: Farmer Registration — **Done** (Aathavan R)
- `FH-22`: Product Management — **Done** (Aathavan R)
- `FH-26`: Inventory Management — **Done** (Arisudhan P)
- `FH-29`: Shopping Cart — **Done** (Arisudhan P)
- `FH-33`: Checkout — **Done** (Arun P)
- `FH-36`: Order Management — **Done** (Arun P)
- `FH-39`: Payment Management — **Done** (Aathavan R)
- `FH-43`: Assign Delivery Partner — **Done** (Arisudhan P)
- `FH-46`: User Management — **To Do** (Anbarasan A)
- `FH-51`: Platform Management — **In Progress** (Aathavan R)
- `FH-54`: Complaint & Support Management — **To Do** (Arisudhan P)
- `FH-58`: Reports & Analytics — **To Do** (Arun P)

---

## 3. New Jira Tasks to Create in Jira

To make your project reflect real agricultural problem-solving in Agile, create these **8 key stories** in Jira:

| Key | Proposed Summary | Issue Type | Priority | Story Points | Recommended Assignee |
|---|---|---|---|---|---|
| **FH-61** | Farmer Profile & Farm Information (Native, Experience, Farming Type) | Story | Highest | 5 | Anbarasan A |
| **FH-64** | "Know Your Farmer" Origin & Practices Showcase | Story | High | 3 | Arisudhan P |
| **FH-67** | Location & Native-Based Farmer Search (State → District → Taluk → Village) | Story | Highest | 5 | Arun P |
| **FH-70** | Harvest Date & Seasonal Availability Tracker | Story | Highest | 3 | Aathavan R |
| **FH-73** | Bulk Buyer Registration & Institutional Procurement Profile | Story | High | 5 | Anbarasan A |
| **FH-76** | Bulk Order Request & Farmer Negotiation Workflow | Story | Highest | 5 | Arun P |
| **FH-79** | Surplus & Unsold Produce Liquidation Module | Story | High | 5 | Aathavan R |
| **FH-85** | Farmer Order Acceptance & Dispatch Dashboard | Story | Highest | 5 | Arisudhan P |
| **FH-88** | Farmer Real-Time Earnings & Settlement Analytics | Story | Medium | 3 | Arun P |
| **FH-94** | Customer Review & Farmer Quality Rating System | Story | Medium | 3 | Anbarasan A |

---

## 4. Four-Sprint Agile Plan

### 🚀 Sprint 1: Foundation, Authentication & Farmer Onboarding
**Sprint Goal:** Secure authentication, multi-role registration, profile setup, and initial design system.
- `FH-4`: Customer Registration & Authentication (Done - Aathavan R)
- `FH-8`: Customer Profile (Done - Anbarasan A)
- `FH-17`: Farmer Registration (Done - Aathavan R)
- `FH-61`: Farmer Profile & Farm Information (Done - Anbarasan A)
- `FH-46`: User Management (Done/To Do - Anbarasan A)
- **Deliverable:** Fully functional JWT auth, profile management, and verified farmer database onboarding.

### 🌾 Sprint 2: Agricultural Catalog, Transparency & Native Search
**Sprint Goal:** Farmers can list produce with harvest data; buyers discover farmers by native location.
- `FH-12`: Product Discovery & Categorized Browsing (Done - Arisudhan P)
- `FH-22`: Product Management CRUD (Done - Aathavan R)
- `FH-26`: Inventory & Stock Control (Done - Arisudhan P)
- `FH-64`: Know Your Farmer Details (Done - Arisudhan P)
- `FH-67`: Native / Location-Based Farmer Search (Done - Arun P)
- `FH-70`: Harvest Date & Stock Availability Management (Done - Aathavan R)
- **Deliverable:** Live catalog showcasing harvest date, farming method (organic/conventional), and district/taluk filtering.

### 🛒 Sprint 3: Retail Cart, Checkout, Payments & Order Fulfillment
**Sprint Goal:** End-to-end consumer checkout pipeline, mock transactions, and delivery assignment.
- `FH-29`: Shopping Cart & Quantity Controls (Done - Arisudhan P)
- `FH-33`: Checkout & Multi-Address Selection (Done - Arun P)
- `FH-39`: Payment Management & Simulated Gateway (Done - Aathavan R)
- `FH-36`: Order Lifecycle Tracking (Done - Arun P)
- `FH-43`: Assign Delivery Partner & Logistics Slot (Done - Arisudhan P)
- `FH-85`: Farmer Order Dashboard (Accept/Reject/Pack) (Done - Arisudhan P)
- **Deliverable:** Working shopping cart, payment confirmation with transaction IDs, and order status timelines.

### 🏪 Sprint 4: Bulk Marketplace, Surplus Produce, Analytics & Hardening
**Sprint Goal:** Institutional bulk orders, surplus produce liquidation, ratings, reports, and system testing.
- `FH-73`: Bulk Buyer Registration & Institutional Portal (Done - Anbarasan A)
- `FH-76`: Bulk Order Negotiation & Request Tracking (Done - Arun P)
- `FH-79`: Surplus / Unsold Produce Listings & Deals (Done - Aathavan R)
- `FH-88`: Farmer Earnings & Revenue Dashboard (Done - Arun P)
- `FH-94`: Ratings, Reviews & Farmer Trust Feedback (Done - Anbarasan A)
- `FH-51`: Platform Management (In Progress/Done - Aathavan R)
- `FH-54`: Complaint & Support Management (Done - Arisudhan P)
- `FH-58`: Reports & Analytical Insights (Done - Arun P)
- **Deliverable:** Complete MVP with bulk workflows, surplus salvage, customer review loops, and analytics.

---

## 5. Agile Scrum Ceremonies Documentation (For Viva / PPT)

### A. Daily Scrum (Stand-up) Format
Each of the 4 team members answers:
1. *What did you accomplish yesterday?*
2. *What will you work on today?*
3. *Are there any blockers / impediments?*

### B. Sprint Review Demo Script
Demonstrate the working software slice increment at the conclusion of each sprint:
- **Sprint 1 Demo:** Show registration as Customer vs. Farmer, JWT login, and profile editing.
- **Sprint 2 Demo:** Show product filtering by Tamil Nadu districts (Erode, Salem, Nilgiris) and harvest date tags.
- **Sprint 3 Demo:** Add to cart, proceed through mock UPI/Card checkout, verify stock decrements, and view order timeline.
- **Sprint 4 Demo:** Submit bulk order request for 100kg tomatoes from a hostel mess, log in as farmer to accept request, view earnings dashboard, and leave review.

### C. Sprint Retrospective Example
- **What went well:** Component modularity in React; fast backend routing with Express and Mongoose schemas.
- **What didn't go well:** Coordinating mock payment transaction states with inventory locks took extra debugging.
- **Improvement Action:** Created unified service abstractions in `api.js` for seamless frontend-backend integration.

### D. Definition of Done (DoD)
A story is only marked **Done** when:
1. Code implementation matches Figma UI specification.
2. API endpoints tested and verified with HTTP 200/201 responses.
3. Responsive design verified on both desktop and mobile viewports.
4. Clean code with no lint or console errors.
5. Peer code review completed and merged into main branch.
6. Jira story status updated with test evidence.
