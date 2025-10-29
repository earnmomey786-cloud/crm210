# Client Management System for Polish Property Owners in Spain

## Overview
This web-based client management system (gestoría) helps Polish clients manage their properties in Spain, specifically for Modelo 210 tax declarations. It tracks client information, property details, co-ownership, and various tax declaration types (imputation of rent, actual rental income, or mixed). The system aims to streamline tax compliance and property management for foreign owners.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The application features a soft pastel design with a grayish-blue background, light gray-blue cards, and subtle shadows. It utilizes rounded corners (16px) and Inter font for a calm, friendly, and professional aesthetic. The property detail page is structured with a 5-tab navigation system: "Datos Generales", "Adquisición", "Gastos", "Contratos", and "Cálculos" for clear separation and improved user experience. Color-coded badges indicate property types (Imputación - pink, Alquiler - mint, Mixta - yellow/cream).

### Technical Implementations
The system is a full-stack TypeScript application. The frontend uses React 18, Wouter for routing, TanStack Query for server state management, and React Hook Form with Zod for form validation. UI components are built with Shadcn/ui (on Radix UI primitives) and styled using Tailwind CSS. The backend is an Express.js application following a RESTful API design, with Zod for request validation. Data persistence is handled by PostgreSQL (Supabase), accessed via Drizzle ORM and the standard node-postgres driver.

### Feature Specifications
Key functionalities include:
- Client and Property Management: CRUD for clients and properties, including co-ownership tracking.
- Modelo 210 Tax Declaration: Calculation and storage of declarations for imputation of rent, actual rental income, and mixed types.
- Acquisition Document Management: Tracking of purchase costs for amortization calculations (33-year amortization, 3% annual depreciation on construction value).
- Expense Management: Classification and tracking of property expenses (proportional vs. 100% deductible), including calculation of deductible amounts.
- Negative Rent Tracking: Management of negative rents with a 4-year compensation system.
- Rental Contract Management: Tracking of rental contracts, tenant information, and rental payments.
- Calculation History: Storage and retrieval of declaration history with detailed formulas and breakdowns.

### System Design Choices
- **Frontend**: Component-based architecture with minimal global state, relying on React Query for server state.
- **Backend**: RESTful API endpoints with Zod schema validation for robust data handling.
- **Data Layer**: PostgreSQL with Drizzle ORM, using a shared schema for type safety across frontend and backend. Soft deletion (active flags) and business status fields are used for data management.
- **Development**: Vite for frontend bundling, esbuild for backend compilation, and HMR for efficient development.
- **Deployment**: Server configured to use port 80 by default (configurable via PORT environment variable) for production deployments. In development mode on Replit, uses port 5000. Server binds to 0.0.0.0 to accept external connections.

## External Dependencies

- **Database**: Supabase (PostgreSQL) with standard `pg` (node-postgres) driver.
- **UI Components**: `@radix-ui/react-*`, Lucide React (icons), `embla-carousel-react`, `cmdk`, `vaul`.
- **Form & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`, `drizzle-zod`.
- **Styling**: `tailwindcss`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Date Management**: `date-fns`.
- **ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`).
- **Development Tools**: `tsx`.

## Deployment

The application is configured for deployment to Easypanel with the following setup:
- **Database**: Supabase PostgreSQL (connection via DATABASE_URL environment variable)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/index.js`
- **Port**: 80 (configurable via PORT environment variable, defaults to 5000 in development)
- **Required Environment Variables**: 
  - `DATABASE_URL`: PostgreSQL connection string
  - `NODE_ENV`: Set to `production` for production deployments
  - `SESSION_SECRET`: Secret key for session management