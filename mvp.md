# Construction Tool & Logistics Management System - MVP

## Goal
A working prototype that demonstrates the core functionality end to end.

## Core Features

### Authentication
- Registration, login, logout (Supabase Auth)
- Role stored per user (Owner / Site Engineer)

### Dashboard
- Counts: projects, machines, tools, employees, maintenance, deliveries, payments
- Ongoing projects, open maintenance, low tool stock, logistics/finance summary

### Project Module
- Add / edit / delete / view projects

### Machine Module
- Register machine, update details, allocate to project
- Machine transfer log

### Tools & Inventory Module
- Add / edit / delete tools with total and available quantity
- Issue (check-out) and return (check-in) with stock adjustment
- Movement ledger, low-stock warnings

### Delivery Module
- Schedule inbound / outbound deliveries
- Status flow: Scheduled -> In transit -> Delivered (or Cancelled)

### Maintenance Module
- Raise request, assign worker, update status
- Machine status kept in sync with open work

### Employee Module
- Add / update / delete employees, role management

### Payment Module
- Add payment, update status, paid / pending totals

### Reports Module
- Machine utilisation, maintenance summary, deliveries by status,
  low tool stock, monthly payments, project budget vs. spend

### Search
- Search across all modules

## Success Criteria
- Secure login with role-based access
- CRUD operations working across every module
- Dashboard and reports show correct aggregates
- Tool issue/return and machine allocation update state correctly
- Search and filters working
