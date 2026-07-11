# Geeth Accounts: Accounts Receivable & Invoice Management System

Geeth Accounts is a production-ready, full-stack financial web application designed for accounts receivable and billing operations. It enables finance teams to manage customers, build multi-line invoices, record payment logs, monitor cash flow metrics, and audit net outstanding debt balances.

---

## Technical Stack & Architecture

### Backend
* **Runtime**: Node.js & Express.js (REST APIs)
* **ORM**: Sequelize (supports transaction isolation, relationships, validation hooks, and pre-hooks)
* **Database**: SQLite (default, zero configuration database file `database.sqlite` for instant local evaluation), easily switched to MySQL in the `.env` settings.
* **Authentication**: JWT (JSON Web Tokens) with request headers injection.
* **Security**: Hashing passwords using `bcryptjs`.
* **Validation**: Input sanity check validations via `express-validator` middleware.

### Frontend
* **Core**: React.js (built on Vite for lightning-fast dev execution)
* **Routing**: React Router DOM v6 (protected layout wraps, navigation context)
* **Icons**: Lucide React
* **Styling**: Vanilla CSS (highly polished custom Dark Mode with glassmorphic cards, transition animations, horizontal horizontal grids, and printable invoice structures)
* **Visualizations**: Lightweight, custom SVG charts for Monthly Revenue trends and Invoice status splits.

---

## Directory Structure

```text
accounts-receivable-system/
│
├── accounts_receivable_system.postman_collection.json  # Importable APIs collection
├── README.md                                          # Documentation
│
├── backend/                                           # Express service
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                                  # Sequelize configuration
│   │   ├── controllers/                               # Route business logic
│   │   │   ├── authController.js
│   │   │   ├── customerController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── paymentController.js
│   │   │   ├── dashboardController.js
│   │   │   └── reportsController.js
│   │   ├── middleware/                                # Session and validation helpers
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── models/                                    # Database schemas
│   │   │   ├── index.js                               # Associations mapper
│   │   │   ├── User.js
│   │   │   ├── Customer.js
│   │   │   ├── Invoice.js
│   │   │   ├── InvoiceItem.js
│   │   │   └── Payment.js
│   │   ├── routes/                                    # Endpoint bindings
│   │   │   ├── auth.js
│   │   │   ├── customers.js
│   │   │   ├── invoices.js
│   │   │   ├── payments.js
│   │   │   ├── dashboard.js
│   │   │   └── reports.js
│   │   ├── app.js                                     # Express application setup
│   │   ├── server.js                                  # Database sync & listener
│   │   └── verify_apis.js                             # API integration tests suite
│   │
│   ├── .env                                           # Environment variables
│   └── package.json
│
└── frontend/                                          # Vite React App
    ├── index.html                                     # SEO header hooks
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                                    # Router paths & Auth wraps
        ├── index.css                                  # Custom dark theme variables
        ├── main.jsx                                   # Entrypoint
        ├── components/                                # Reusable UI components
        │   ├── Sidebar.jsx                            # Navigation drawer
        │   ├── Modal.jsx                              # Popup windows
        │   ├── MetricCard.jsx                         # Telemetry status boxes
        │   └── CustomCharts.jsx                       # Custom SVG charts
        ├── context/
        │   └── AuthContext.jsx                        # User session state manager
        ├── pages/                                     # Full-page screens
        │   ├── AuthPage.jsx                           # Login/Signup forms
        │   ├── Dashboard.jsx                          # Main insights panel
        │   ├── Customers.jsx                          # Customers CRUD registry
        │   ├── Invoices.jsx                           # Invoice builder list
        │   ├── InvoiceDetail.jsx                      # Statement viewer & payment drawer
        │   ├── Payments.jsx                           # Payments transaction ledger
        │   └── Reports.jsx                            # Financial audit tabs
        └── utils/
            └── api.js                                 # Axios interceptors instance
```

---

## Database Schema (Relational Design)

### 1. Users Table
Stores dashboard user authentication details.
* `id` (UUID, Primary Key)
* `name` (VARCHAR, Not Null)
* `email` (VARCHAR, Unique, Not Null)
* `password` (VARCHAR, Not Null) - *Bcrypt Hashed*
* `createdAt` / `updatedAt` (TIMESTAMP)

### 2. Customers Table
Stores customer accounts. A user owns customers.
* `id` (UUID, Primary Key)
* `name` (VARCHAR, Not Null)
* `companyName` (VARCHAR, Not Null)
* `gstNumber` (VARCHAR, Nullable)
* `email` (VARCHAR, Not Null)
* `mobileNumber` (VARCHAR, Not Null)
* `address` (TEXT, Not Null)
* `userId` (UUID, Foreign Key referencing Users)
* `createdAt` / `updatedAt` (TIMESTAMP)

### 3. Invoices Table
Stores parent invoices. Connected to a customer and owned by a user.
* `id` (UUID, Primary Key)
* `invoiceNumber` (VARCHAR, Unique, Not Null) - *Auto-generated sequence e.g., INV-1001*
* `invoiceDate` (DATE, Not Null)
* `dueDate` (DATE, Not Null)
* `subtotal` (DECIMAL, Not Null) - *Auto-calculated*
* `gstAmount` (DECIMAL, Not Null) - *Auto-calculated*
* `discountAmount` (DECIMAL, Not Null) - *Auto-calculated*
* `grandTotal` (DECIMAL, Not Null) - *Auto-calculated*
* `status` (ENUM: 'Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', Default: 'Draft')
* `customerId` (UUID, Foreign Key referencing Customers)
* `userId` (UUID, Foreign Key referencing Users)
* `createdAt` / `updatedAt` (TIMESTAMP)

### 4. InvoiceItems Table
Stores line item details for invoices. Cascades on invoice deletion.
* `id` (UUID, Primary Key)
* `description` (VARCHAR, Not Null)
* `quantity` (INTEGER, Not Null, Min: 1)
* `unitPrice` (DECIMAL, Not Null)
* `gstPercentage` (DECIMAL, Not Null)
* `discountPercentage` (DECIMAL, Not Null)
* `subtotal` (DECIMAL, Not Null) - *Auto-calculated: quantity * price*
* `gstAmount` (DECIMAL, Not Null) - *Auto-calculated: (subtotal - disc) * gst%*
* `discountAmount` (DECIMAL, Not Null) - *Auto-calculated: subtotal * disc%*
* `total` (DECIMAL, Not Null) - *Auto-calculated: subtotal - disc + gst*
* `invoiceId` (UUID, Foreign Key referencing Invoices)
* `createdAt` / `updatedAt` (TIMESTAMP)

### 5. Payments Table
Stores recorded payments. Updates parent invoice status when captured.
* `id` (UUID, Primary Key)
* `paymentDate` (DATE, Not Null)
* `paymentMethod` (VARCHAR, Not Null) - *e.g., Bank Transfer, UPI, Credit Card, Cash*
* `amountPaid` (DECIMAL, Not Null)
* `referenceNumber` (VARCHAR, Nullable)
* `paymentStatus` (ENUM: 'Captured', 'Pending', 'Failed', 'Refunded', Not Null) - *Manually selected*
* `invoiceId` (UUID, Foreign Key referencing Invoices)
* `userId` (UUID, Foreign Key referencing Users)
* `createdAt` / `updatedAt` (TIMESTAMP)

---

## API Specifications

All resources requests require a header: `Authorization: Bearer <JWT_Token>`

| Method | Path | Description | Access |
|---|---|---|---|
| **POST** | `/api/auth/signup` | Create a user account | Public |
| **POST** | `/api/auth/login` | Login user, return token | Public |
| **GET** | `/api/auth/me` | Fetch active user credentials | Private |
| **GET** | `/api/customers` | Fetch all customers | Private |
| **POST** | `/api/customers` | Create a customer | Private |
| **PUT** | `/api/customers/:id` | Edit a customer details | Private |
| **DELETE** | `/api/customers/:id` | Delete customer (checks for active invoices) | Private |
| **GET** | `/api/invoices` | List invoices (search, filter, sort) | Private |
| **GET** | `/api/invoices/:id` | Get single invoice details | Private |
| **POST** | `/api/invoices` | Create invoice with line items | Private |
| **PUT** | `/api/invoices/:id` | Edit/Update invoice | Private |
| **DELETE** | `/api/invoices/:id` | Delete invoice and line items | Private |
| **GET** | `/api/payments` | List payments history | Private |
| **POST** | `/api/payments` | Record a payment transaction | Private |
| **DELETE** | `/api/payments/:id` | Delete a payment record | Private |
| **GET** | `/api/dashboard` | Fetch summary telemetry KPIs | Private |
| **GET** | `/api/reports/outstanding` | Customer outstanding balances report | Private |
| **GET** | `/api/reports/monthly-revenue` | Monthly revenue bar metrics | Private |
| **GET** | `/api/reports/payment-history`| History log (date ranges, status filter) | Private |

---

## Setup & Running Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18 or higher) and `npm` installed.

### 1. Configure the Backend Service
1. Open a terminal and enter the backend directory:
   ```bash
   cd backend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Initialize the environment variables:
   A default `.env` file is already created. It uses local **SQLite** out-of-the-box (creating `database.sqlite` automatically in the root of the backend folder).
   
   To run on **MySQL** instead:
   * Create a MySQL database (e.g., `invoice_db`).
   * Open the `.env` file and change:
     ```env
     DB_DIALECT=mysql
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=invoice_db
     DB_USER=your_mysql_username
     DB_PASS=your_mysql_password
     ```
4. Start the backend service in developer mode:
   ```bash
   npm run dev
   ```
   The backend API will start listening at `http://localhost:5000`.

5. Optionally, seed the database with mock records (users, corporate customers, invoices, and payment histories) to evaluate the system with realistic data immediately:
   ```bash
   npm run seed-db
   ```

### 2. Run Automated API Tests
You can run the built-in programmatic API validation script to ensure database sync, auth JWT issuing, and math calculations (taxes, discounts, totals) are working correctly:
```bash
# inside the backend/ folder
npm run test-api
```

### 3. Configure the Frontend React App
1. Open a separate terminal and enter the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface in your browser:
   Open `http://localhost:5173`.

---

## API Testing with Postman
1. Import the Postman Collection file `accounts_receivable_system.postman_collection.json` located at the root of the project.
2. In Postman, configure the environment variable:
   * `base_url`: `http://localhost:5000/api`
3. Execute **Signup User** first to register an account, then run **Login User** to cache your token.
4. When you execute **Login User**, a Postman Test script will automatically extract the bearer token from the JSON response and store it under the environment variable `token`. Subsequent requests will utilize this token automatically.
