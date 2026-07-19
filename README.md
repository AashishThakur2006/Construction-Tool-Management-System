# Construction Tool Management System

A web-based application that helps construction companies manage projects, machines, employees, maintenance and payments through a centralized platform.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS** and **SQLite** (zero-setup, file-based database).

## Features

- User registration, login and logout with role-based access (Owner / Site Engineer)
- Dashboard with live statistics of projects, machines, employees, maintenance and payments
- Project management (add / edit / delete / search)
- Machine management (register / update / allocate to projects)
- Maintenance management (raise requests, assign workers, update status)
- Employee management with role management
- Payment management (add payments, update payment status)
- Search and filters across all modules

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000, register an account (choose the Owner or Site Engineer role) and log in.

The SQLite database is created automatically at `data/ctms.db` on first run.

## Project Structure

```
src/
  app/            # Pages and API routes (Next.js App Router)
  lib/            # Database connection + auth helpers
  components/     # Shared UI components
```

## Docs

- [Project Scope](scope.md)
- [Components](components.md)
- [MVP](mvp.md)
