# Remittance & Goal Planner

> **College Project Expo Prototype**  
> **SAFE SIMULATION ONLY**: No real banking APIs, no UPI/payment gateways, and no real money is ever moved.

---

## 1. Problem Statement
International students and migrant workers frequently face volatile exchange rates and opaque transfer fees when sending money abroad. Unplanned transfers often deplete savings meant for essential non-negotiable expenses—such as semester tuition fees, hostel rent, and emergency health reserves. Existing banking apps offer transfers without protecting local savings, causing accidental financial distress.

## 2. Solution
**Remittance & Goal Planner** provides a simulated financial environment that couples remittance corridor comparison with automated goal protection:
1. Compare two mock corridors based on fees, speed, FX rates, and recipient amounts.
2. Generate deterministic send windows to guarantee transfers arrive before deadlines.
3. Review and manually approve simulated drafts without auto-executing payments.
4. Calculate leftover balances post-transfer and park funds directly into designated student goals (e.g., Exam Fee, Rent).

---

## 3. Three Core Modules

### Module 1 — Remittance Comparison (`/remittance`)
- Supports multiple international destinations (United States, United Kingdom, European Union, Canada, Australia, United Arab Emirates).
- For each destination, evaluates 2 simulated settlement corridors (Express vs. Economy) with fixed mock FX rates.
- Formula: $\text{estimated\_recipient\_amount} = (\text{amount} - \text{fee}) \times \text{fx\_rate}$.
- Renders side-by-side comparison with dynamic contextual badges:
  - `LOWER FEE`
  - `FASTER`
  - `HIGHER ESTIMATED VALUE`
- Highlights that data is purely simulation without live market feeds.

### Module 2 — Send Window + Send Draft + User Approval (`/send-draft/:id`)
- Calculates deterministic send windows based on target delivery deadline and corridor transfer speed (in days).
- Creates a `DRAFT` status record with suggested send time (e.g., `10:00 AM - 02:00 PM` on target send date).
- The transfer **never** moves money on creation; manual user click of **"Approve Simulation"** is strictly required.
- Verifies available student balance before state transition and records a `SIMULATED_APPROVED` transaction.

### Module 3 — Leftover Money → Goal Allocation (`/goals`)
- Computes leftover available funds after simulated transfer deduction.
- Displays visual progress meters for educational goals (Exam Fee, Hostel Rent).
- Allows user to park part or all leftover funds towards named goals.
- Enforces strict validations:
  - Amount must be $> 0$.
  - Amount must not exceed user's available balance.
  - Amount must not exceed the goal's remaining needed target.

---

## 4. Technology Stack

- **Frontend**:
  - React.js 19
  - Vite 8
  - Tailwind CSS v4
  - React Router DOM v7
  - Axios
  - Lucide React (fintech icons)
- **Backend**:
  - Python 3.11+
  - FastAPI (REST API with Swagger docs at `/docs`)
  - SQLAlchemy 2.0 ORM
  - Pydantic v2 validation models
  - SQLite database engine
- **Testing**:
  - Pytest with FastAPI TestClient and SQLite In-Memory StaticPool

---

## 5. System Architecture

```text
       React Frontend (Vite @ http://localhost:5173)
                           │
                           │ HTTP REST API (Axios Client)
                           ▼
       FastAPI Backend (@ http://localhost:8000)
                           │
                           │ SQLAlchemy ORM (Models & Sessions)
                           ▼
       SQLite Database (remittance_planner.db)
```

---

## 6. Database Schema

### `users`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | User ID (Demo Student = 1) |
| `name` | VARCHAR(100) | Full user name |
| `balance` | FLOAT | Available balance in INR (starts at ₹20,000) |
| `currency` | VARCHAR(10) | Currency code (default: INR) |
| `created_at` | DATETIME | Record creation timestamp |

### `corridors`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Corridor ID |
| `name` | VARCHAR(100) | Corridor A or Corridor B |
| `fee` | FLOAT | Fixed transfer fee (₹150 or ₹80) |
| `speed_days` | INTEGER | Transfer duration (1 or 2 days) |
| `fx_rate` | FLOAT | Fixed mock rate (83.10 or 82.80) |
| `destination_currency` | VARCHAR(10) | Destination currency (USD) |
| `description` | TEXT | Settlement route details |
| `is_active` | BOOLEAN | Active flag |

### `goals`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Goal ID |
| `user_id` | INTEGER FK | User reference |
| `name` | VARCHAR(120) | Goal title (Exam Fee, Hostel Rent) |
| `target_amount` | FLOAT | Target amount in INR |
| `saved_amount` | FLOAT | Amount reserved |
| `deadline` | VARCHAR(50) | Target completion date |
| `status` | VARCHAR(30) | `IN_PROGRESS` or `COMPLETED` |
| `created_at` | DATETIME | Creation timestamp |

### `remittance_drafts`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Draft ID |
| `user_id` | INTEGER FK | User reference |
| `corridor_id` | INTEGER FK | Selected corridor |
| `amount` | FLOAT | Remittance principal amount |
| `fee` | FLOAT | Corridor fee |
| `fx_rate` | FLOAT | Corridor FX rate |
| `estimated_recipient_amount` | FLOAT | Recipient expected amount |
| `suggested_send_start` | VARCHAR(100) | Suggested window start timestamp |
| `suggested_send_end` | VARCHAR(100) | Suggested window end timestamp |
| `deadline` | VARCHAR(50) | Delivery deadline |
| `status` | VARCHAR(30) | `DRAFT`, `APPROVED`, or `CANCELLED` |
| `created_at` | DATETIME | Draft creation timestamp |
| `approved_at` | DATETIME | Manual approval timestamp |

### `simulated_transactions`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Simulated transaction ID |
| `user_id` | INTEGER FK | User reference |
| `draft_id` | INTEGER FK | Approved draft reference |
| `amount` | FLOAT | Principal amount deducted |
| `fee` | FLOAT | Fee deducted |
| `total_deducted` | FLOAT | Total debit (amount + fee) |
| `status` | VARCHAR(40) | `SIMULATED_APPROVED` |
| `created_at` | DATETIME | Execution timestamp |

### `goal_allocations`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Allocation ID |
| `user_id` | INTEGER FK | User reference |
| `goal_id` | INTEGER FK | Goal reference |
| `amount` | FLOAT | Parked allocation amount |
| `created_at` | DATETIME | Execution timestamp |

### `activity_logs`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Activity log ID |
| `user_id` | INTEGER FK | User reference |
| `action` | VARCHAR(100) | Action tag (e.g., Created Send Draft) |
| `description` | TEXT | Human-readable event description |
| `created_at` | DATETIME | Timestamp |

---

## 7. API Documentation

Interactive Swagger UI is available at:  
👉 **`http://localhost:8000/docs`**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and simulation check |
| `GET` | `/api/dashboard/{user_id}` | Consolidated metrics, goals, and activity |
| `GET` | `/api/corridors` | Active simulation corridors |
| `POST` | `/api/remittance/compare` | Compare corridors side-by-side |
| `POST` | `/api/drafts` | Create remittance draft with send window |
| `GET` | `/api/drafts/{draft_id}` | Retrieve specific draft details |
| `POST` | `/api/drafts/{draft_id}/approve`| Manually approve draft & deduct simulated balance |
| `POST` | `/api/drafts/{draft_id}/cancel` | Cancel draft without balance deduction |
| `GET` | `/api/goals/{user_id}` | List user goals with progress & remaining balance |
| `POST` | `/api/goals` | Create a new named student goal |
| `POST` | `/api/goals/{goal_id}/allocate` | Park leftover funds into a goal |
| `GET` | `/api/activity/{user_id}` | Chronological audit logs (newest first) |
| `POST` | `/api/demo/reset` | Reset database to pristine demo state |

---

## 8. Folder Structure

```text
remittance-goal-planner/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── activity.py
│   │   │   ├── dashboard.py
│   │   │   ├── demo.py
│   │   │   ├── drafts.py
│   │   │   ├── goals.py
│   │   │   └── remittance.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── goal_service.py
│   │   │   ├── remittance_service.py
│   │   │   └── send_window_service.py
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   ├── tests/
│   │   └── test_api.py
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BalanceCard.jsx
│   │   │   ├── CorridorCard.jsx
│   │   │   ├── GoalCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── SendDraftCard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── Activity.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Remittance.jsx
│   │   │   └── SendDraft.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 9. Installation & Running Instructions

### Backend Setup

1. Open a terminal and enter the `backend` directory:
   ```bash
   cd backend
   ```
2. Activate or create a virtual environment (optional):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run automated test suite:
   ```bash
   python -m pytest tests/test_api.py -v
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Backend will be running at `http://localhost:8000`.  
   Swagger docs available at `http://localhost:8000/docs`.

### Frontend Setup

1. Open a second terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at `http://localhost:5173`.

---

## 10. Complete Expo Demo Sequence (1-Minute Walkthrough)

1. **Dashboard Check (`/dashboard`)**:
   - Notice initial available balance: **₹20,000.00**.
   - Notice existing goals: **Exam Fee** (₹2,000 / ₹5,000) and **Hostel Rent** (₹2,000 / ₹8,000).
   - Notice persistent warning banner: *"SIMULATION ONLY — No real money movement"*.

2. **Module 1 — Remittance Comparison (`/remittance`)**:
   - Enter Amount: `₹10,000`, Deadline: `2026-10-10`.
   - Click **"Compare Options"**.
   - Observe side-by-side cards:
     - **Corridor A**: Fee ₹150, Speed 1 Day, Recipient Gets ~$818.54 USD (`FASTER`, `HIGHER ESTIMATED VALUE`).
     - **Corridor B**: Fee ₹80, Speed 2 Days, Recipient Gets ~$821.38 USD (`LOWER FEE`).
   - Select **Corridor A** and click **"Create Send Draft"**.

3. **Module 2 — Send Window & Manual Approval (`/send-draft/:id`)**:
   - System navigates to `/send-draft/:id`.
   - Review draft details:
     - Amount: `₹10,000`
     - Fee: `₹150`
     - Total to deduct: `₹10,150`
     - Deterministic suggested send window: `October 09, 2026, 10:00 AM - 02:00 PM`.
     - Status: `DRAFT`.
   - Click **"Approve Simulation"**.
   - Status transitions to `APPROVED`, recording a `SIMULATED_APPROVED` entry.
   - Remaining available balance is automatically updated to:
     $$\text{₹}20,000 - \text{₹}10,150 = \textbf{₹9,850.00}$$

4. **Module 3 — Leftover Money → Goal Allocation (`/goals`)**:
   - Click **"Park Leftover Toward Goal"**.
   - See available balance: **₹9,850.00**.
   - Click **"Allocate Leftover Money"** on the **Exam Fee** card (Remaining needed: ₹3,000).
   - Enter or select quick button `₹3000` and click **"Park Amount"**.
   - Exam Fee progress updates to **100% (COMPLETED)** with ₹5,000 saved.
   - Available balance updates to:
     $$\text{₹}9,850 - \text{₹}3,000 = \textbf{₹6,850.00}$$

5. **Audit Trail Verification (`/activity`)**:
   - Navigate to `/activity`.
   - Review every step sequentially logged in real time.

6. **Reset Environment**:
   - Click **"Reset Demo"** in the top navigation bar at any time to return the database to the clean initial state.

---

## 11. Limitations & Safety Notice

- **No Live Financial Integrations**: This application deliberately does not interface with SWIFT, ACH, UPI, Razorpay, Stripe, or any bank account.
- **Fixed Mock Rates**: FX rates and corridor fees are statically defined in the database for deterministic, reliable demonstrations.
- **Single User Simulation**: Seeded with a default student profile (`Demo Student`, ID: 1) for seamless expo presentations.
