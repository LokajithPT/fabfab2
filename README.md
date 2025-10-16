# FabClean Management System

FabClean is a full-stack management system designed for dry cleaning and laundry services. It features a robust Python Flask backend for API services and administration, coupled with a modern React/TypeScript frontend for an intuitive user experience, including an Electron desktop application.

## Features

### Backend (Python Flask)

*   **User Management:** Customer signup, login (JWT authenticated), and admin login (session-based).
*   **Service Management:** CRUD operations for laundry services (name, price, duration, status).
*   **Order Management:** Create, retrieve, update, and delete customer orders. Orders are linked to services and customers.
*   **Customer-Specific Order Access:** Customers can view and manage their own orders.
*   **Worker Tracking:** Endpoint for workers to scan and update order status/location.
*   **QR Code Generation:** Automatically generates QR codes for orders, containing all relevant order information.
*   **Admin Panel:** Dedicated routes for administrative tasks, secured by admin login.
*   **Database:** SQLite for data storage, managed with SQLAlchemy.

### Frontend (React/TypeScript with Electron)

*   **Dashboard:**
    *   **Super Admin Dashboard:** Provides a high-level overview of total revenue, franchises, orders, pending pickups, services, shipments, and active stores. Includes quick actions for onboarding franchises, adding services, managing franchises, and generating reports.
    *   **Franchise Owner Dashboard:** Focuses on individual store performance with KPIs for revenue, new customers, active orders, pending pickups, services in progress, and ready-for-pickup items. Includes quick actions for creating new orders, adding customers, and dispatching shipments.
*   **Orders Management:** Comprehensive table to view, search, filter, sort, edit, and delete customer orders.
*   **Customers Management:** Detailed customer list with search, filter, view, edit, and delete functionalities. Includes customer statistics.
*   **Services Management:** Interface to add, edit, and delete services offered by the business.
*   **Inventory Management:** Tracks product stock, provides low stock alerts, demand forecasting, and restock recommendations. Includes a product inventory table.
*   **Logistics & Tracking:**
    *   **Fleet Status:** Overview of vehicles and drivers, showing active deliveries and idle status.
    *   **Active Deliveries:** Detailed view of in-transit orders with progress and ETA.
    *   **Route Optimization:** Provides insights and suggestions for improving delivery routes.
    *   **Shipment Creation:** Allows combining multiple orders into a single shipment with a Unified Tracking ID (UTI).
    *   **Transport Order Template:** Generates printable transport orders.
*   **Analytics & Reports:** Offers various analytical views including revenue trends, service performance, customer value distribution, and operational efficiency. Features AI-powered business insights and export options (PDF, CSV).
*   **Electron Desktop Application:** The frontend is packaged as an Electron app, providing a native desktop experience.
*   **Responsive UI:** Built with Tailwind CSS and Shadcn UI components for a modern, adaptive design.
*   **Theme Support:** Light and dark mode toggle.

## Technologies Used

**Backend:**
*   Python
*   Flask
*   SQLAlchemy
*   Flask-JWT-Extended
*   Flask-CORS
*   Werkzeug.security
*   qrcode
*   uuid

**Frontend:**
*   React
*   TypeScript
*   Vite
*   Wouter (Router)
*   @tanstack/react-query (Data Fetching)
*   Tailwind CSS
*   Shadcn UI (Component Library)
*   Recharts (Charting Library)
*   Electron (Desktop Application Framework)
*   Vercel Speed Insights

**Database:**
*   SQLite

## Getting Started

### Prerequisites

*   Python 3.8+
*   Node.js 18+
*   npm or Yarn
*   Git

### Backend Setup

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: .\venv\Scripts\activate
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Initialize the database and seed initial data:
    ```bash
    python seed.py
    ```
5.  Run the Flask backend:
    ```bash
    python app.py
    ```
    The backend API will be available at `http://127.0.0.1:5005`.

### Frontend Setup

1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install Node.js dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Run the React development server:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The frontend will be available at `http://localhost:5173`.

### Running the Electron Desktop Application

1.  Ensure the React frontend is built (or running in dev mode if `electron.js` is configured to point to `localhost:5173`).
2.  From the `client` directory, run:
    ```bash
    npm run electron
    # or yarn electron
    ```

### Admin Credentials

For the admin panel (`/admin`):
*   **Username:** `hahaboi`
*   **Password:** `somethingsomething`

## API Endpoints (Overview)

**Public/Customer-facing:**
*   `/api/services` (GET): Get all services.
*   `/auth/signup` (POST): Register a new customer.
*   `/auth/login` (POST): Customer login.
*   `/api/orders` (POST): Create a new order.
*   `/api/orders?email=<email>` (GET): Get orders for a specific customer.
*   `/api/orders/<order_id>` (PUT, DELETE): Update or delete a specific order.
*   `/worker/scan` (POST): Worker scan for tracking.

**Admin-only:**
*   `/admin/login` (GET, POST): Admin login page and endpoint.
*   `/admin/api/services` (GET, POST, PUT, DELETE): CRUD for services.
*   `/admin/api/customers` (GET, POST, PUT, DELETE): CRUD for customers.
*   `/admin/api/orders` (GET, POST, PUT, DELETE): CRUD for orders.

## Folder Structure

```
fabfab/
├── client/             # React/TypeScript Frontend (Admin Dashboard, Electron App)
│   ├── public/         # Static assets
│   ├── src/            # React source code
│   │   ├── components/ # Reusable UI components (Shadcn UI, custom dashboard widgets)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions, data, query client
│   │   └── pages/      # Main application pages (Dashboard, Orders, Customers, etc.)
│   ├── electron.js     # Electron main process file
│   ├── preload.js      # Electron preload script
│   ├── index.html      # Main HTML file
│   ├── package.json    # Frontend dependencies and scripts
│   └── ...
├── server/             # Python Flask Backend
│   ├── app.py          # Main Flask application, routes, models, auth
│   ├── models.py       # SQLAlchemy models
│   ├── seed.py         # Database seeding script
│   ├── extensions.py   # Database instance
│   ├── qr/             # Generated QR codes
│   ├── templates/      # HTML templates (e.g., admin login)
│   ├── venv/           # Python virtual environment
│   ├── requirements.txt# Python dependencies
│   └── ...
├── shared/             # Shared TypeScript schema definitions
├── customer/           # Separate customer-facing frontend (React/Vite)
├── worker/             # Separate worker-facing frontend (React/Vite)
├── drizzle/            # Drizzle ORM migrations (if used)
├── package.json        # Root package for monorepo scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── ...
```

## Contributing

Contributions are welcome! Please follow standard GitHub flow: fork the repository, create a feature branch, and submit a pull request.

## License

This project is licensed under the MIT License.
