# ASPIRE TOUR ERP – First Report Module

Full-stack enterprise Tour Management ERP web application for **ASPIRE TOURISM INDIA PVT LTD**, specifically implementing the **First Report (Tour Confirmation Sheet)** module.

---

## 1. Technology Architecture

### Frontend
- **Framework**: React.js with Vite
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Styling**: 100% Pure Modular Custom CSS (`global.css`, `Sidebar.css`, `FirstReport.css`)
- **No external CSS frameworks used** (Zero Tailwind, Zero Bootstrap).

### Backend
- **Framework**: Python Django 5.2 & Django REST Framework (DRF)
- **CORS**: `django-cors-headers`
- **Architecture**: RESTful API with ModelViewSet, Serializer validation, and Routers.

### Database
- **Engine**: MySQL 8.0 (`aspire_tour_erp`)
- **ORM**: Django ORM with schema migrations
- **Driver**: `mysqlclient`

---

## 2. Project Directory Structure

```text
GT_Software/
│
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   ├── first_report/
│   │   ├── migrations/
│   │   │   ├── 0001_initial.py
│   │   │   └── __init__.py
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── init_db.sql
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   ├── pages/
│   │   │   ├── FirstReport.jsx
│   │   │   └── FirstReport.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── .env.example
│
└── README.md
```

---

## 3. Database Schema (`first_reports`)

| Column Name | Data Type | Constraints / Description |
|---|---|---|
| `id` | BIGINT | Primary Key, Auto Increment |
| `report_date` | DATE | Booking/Report Date |
| `travel_date` | DATE | Date of Travel |
| `tour_type` | VARCHAR(50) | Choices: `International`, `Domestic` |
| `crm_id` | VARCHAR(100) | Unique, Alphanumeric |
| `sales_by` | VARCHAR(150) | Sales Person Name |
| `branch` | VARCHAR(50) | Choices: `Coimbatore`, `Chennai`, `Erode`, `Tiruppur`, `Salem` |
| `guest_name` | VARCHAR(200) | Primary Guest Name |
| `mobile_no` | VARCHAR(15) | Indian 10-digit regex (`^[6-9]\d{9}$`) |
| `dob` | DATE | Nullable, Optional |
| `email_id` | VARCHAR(254) | Nullable, Email validation |
| `adults` | INT UNSIGNED | Default 0, Non-negative |
| `child` | INT UNSIGNED | Default 0, Non-negative |
| `total_pax` | INT UNSIGNED | Auto-calculated: `adults + child` |
| `client_type` | VARCHAR(50) | Choices: `Family`, `Couple`, `Friends`, `Corporate Group`, `Solo` |
| `destination` | VARCHAR(200) | Destination Name |
| `duration` | INT UNSIGNED | Duration in Days/Nights (>= 1) |
| `rooms` | INT UNSIGNED | Rooms count (>= 1) |
| `created_at` | DATETIME(6) | Timestamp on creation |
| `updated_at` | DATETIME(6) | Timestamp on update |

---

## 4. REST API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/first-reports/` | List all first reports (supports search & ordering) |
| `POST` | `/api/first-reports/` | Create a new First Report |
| `GET` | `/api/first-reports/{id}/` | Retrieve a specific report by ID |
| `PUT` | `/api/first-reports/{id}/` | Full update of a report |
| `PATCH` | `/api/first-reports/{id}/` | Partial update of a report |
| `DELETE` | `/api/first-reports/{id}/` | Delete a report |

---

## 5. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MySQL Server (Running on port 3306)

---

### Step A: Backend Setup (Django + MySQL)

1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd c:\Users\ACER\Desktop\GT_Software\backend
   ```

2. Create virtual environment (if not already created) and activate it:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure database in `.env`:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   DB_ENGINE=django.db.backends.mysql
   DB_NAME=aspire_tour_erp
   DB_USER=root
   DB_PASSWORD=root
   DB_HOST=127.0.0.1
   DB_PORT=3306
   ```

5. Create database (or run the provided `init_db.sql` script):
   ```sql
   CREATE DATABASE IF NOT EXISTS aspire_tour_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

6. Run migrations:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

7. Start the Django development server:
   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```
   *The API will be live at `http://127.0.0.1:8000/api/first-reports/`*

---

### Step B: Frontend Setup (React + Vite)

1. Open another PowerShell window and navigate to the frontend folder:
   ```powershell
   cd c:\Users\ACER\Desktop\GT_Software\frontend
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Configure `.env`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

4. Start Vite development server:
   ```powershell
   npm run dev
   ```

5. Open your web browser at:
   ```
   http://127.0.0.1:5173/
   ```

---

## 6. Key Features Implemented

1. **Exact Excel Design Fidelity**:
   - Soft pink (`#F3DEDE`) table-cell labels.
   - Deep navy blue (`#213B59` / `#14283F`) headers and sidebar.
   - Structured three-column layout for Tour Information and Guest Information sections.
2. **Auto Calculation of Total Pax**:
   - Total Pax automatically computes in real-time as `Adults + Child`.
   - Read-only field on the frontend.
   - Backend recalculates and enforces Total Pax independently for complete security.
3. **Comprehensive Validations**:
   - Unique alphanumeric CRM ID.
   - Indian 10-digit mobile number format verification (`^[6-9]\d{9}$`).
   - Non-negative pax values, non-zero minimum duration and rooms.
   - Server-side error mapping displaying actionable feedback next to respective fields.
4. **Responsive Layout**:
   - Desktop: Fixed sidebar with 3-column structured form.
   - Mobile: Responsive slide-in sidebar with toggle button and auto-stacking single-column fields.
