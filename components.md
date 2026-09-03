# Construction Tool & Logistics Management System - Components

## Frontend
User interface (Next.js App Router + Tailwind CSS).
- Login / Register pages
- Dashboard
- Projects, Machines, Tools & Inventory, Deliveries
- Maintenance, Employees, Payments
- Reports

## Backend
Application logic (Next.js route handlers).
- Authentication (Supabase Auth) + session/role guards
- Business logic and CRUD operations
- Input validation (pure helpers in `lib/validation.ts`)
- Role management (Owner / Site Engineer)
- Stock and status reconciliation (tools, machines, maintenance)

## Database (Supabase Postgres)
- profiles (app role + name, linked to auth.users)
- projects
- machines
- machine_transfers
- tools
- tool_transactions
- deliveries
- employees
- maintenance_records
- payments

## User Roles

### Owner
- Manage projects, register equipment and tools, manage payments
- Full delete rights, view reports

### Site Engineer
- Allocate machines, issue/return tools, schedule deliveries
- Raise maintenance requests, assign workers, update progress
- Monitor payments and reports

## System Modules
- Authentication
- Dashboard
- Project
- Machine
- Tools & Inventory
- Delivery
- Maintenance
- Employee
- Payment
- Reporting
