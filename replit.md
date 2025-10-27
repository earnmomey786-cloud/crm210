# Client Management System for Polish Property Owners in Spain

## Overview

This is a web-based client management system (gestoría) designed to manage Polish clients and their properties in Spain, specifically for handling Modelo 210 tax declarations. The application allows tracking client information, property details, co-ownership arrangements, and different types of property tax declarations (imputation of rent, actual rental income, or mixed).

The system is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Core Libraries:**
- React 18 with TypeScript for the UI layer
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- React Hook Form with Zod for form validation

**UI Component System:**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design system
- Design follows soft, approachable aesthetic with pastel colors (referenced in design_guidelines.md)
- Components configured in "new-york" style variant

**State Management Pattern:**
- Server state managed via React Query with disabled refetching (staleTime: Infinity)
- Form state handled by React Hook Form
- No global client state management library (Redux, Zustand, etc.)
- Query invalidation pattern used for cache updates after mutations

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Custom Vite middleware integration for development with HMR
- RESTful API design pattern

**API Structure:**
- `/api/clientes` - Client CRUD operations
- `/api/clientes/:id/propiedades` - Properties by client
- `/api/propiedades/:id` - Individual property operations
- `/api/propiedades/:id/copropietarios` - Co-owner management

**Request/Response Handling:**
- JSON body parsing with raw body preservation
- Zod schema validation on incoming requests
- Standardized error responses with appropriate HTTP status codes
- Request logging middleware for API routes

### Data Layer

**ORM & Database:**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the database (via Neon serverless driver with WebSocket support)
- Database schema defined in shared/schema.ts for type sharing between client and server

**Schema Design:**
- `clientes` table: Client information (NIE, name, contact details, Polish address)
- `propiedades` table: Property details (cadastral reference, address, purchase info, cadastral values)
- `propiedad_copropietarios` junction table: Co-ownership relationships with percentage shares
- Soft deletion pattern (activo/activa boolean flags)
- Indexed fields for common queries (NIE, client names, declaration types)

**Data Access Pattern:**
- Storage abstraction layer (IStorage interface) in server/storage.ts
- DatabaseStorage implementation handles all database operations
- Supports relationships via Drizzle's query builder and joins

### Build & Development System

**Build Pipeline:**
- Vite for frontend bundling and development server
- esbuild for backend compilation (ESM output)
- TypeScript compilation checking via tsc (noEmit mode)

**Development Features:**
- Hot Module Replacement (HMR) via Vite
- Replit-specific plugins (cartographer, dev banner, runtime error overlay)
- Path aliases configured (@/, @shared/, @assets/)

**Production Build:**
- Frontend assets compiled to dist/public
- Backend bundle to dist/index.js
- Single node process serves both static assets and API

### External Dependencies

**Database:**
- Neon serverless PostgreSQL (specified via DATABASE_URL environment variable)
- Connection pooling via @neondatabase/serverless
- WebSocket transport for serverless compatibility

**UI Component Libraries:**
- Radix UI primitives (@radix-ui/*) for accessible component foundations
- Lucide React for icons
- embla-carousel-react for carousels
- cmdk for command palette
- date-fns for date manipulation
- vaul for drawer components

**Form & Validation:**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for Zod integration
- drizzle-zod for automatic schema generation from Drizzle models

**Styling:**
- Tailwind CSS with custom configuration
- class-variance-authority (CVA) for component variants
- clsx and tailwind-merge for class name composition

**Development Tools:**
- tsx for TypeScript execution in development
- drizzle-kit for database migrations
- ws for WebSocket polyfill (required by Neon driver in Node.js)

**Type Safety:**
- Shared schema types between frontend and backend
- Full TypeScript strict mode enabled
- Path mapping for clean imports