# Client Management System for Polish Property Owners in Spain

## Overview

This is a web-based client management system (gestoría) designed to manage Polish clients and their properties in Spain, specifically for handling Modelo 210 tax declarations. The application allows tracking client information, property details, co-ownership arrangements, and different types of property tax declarations (imputation of rent, actual rental income, or mixed).

The system is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 28, 2025 - Fase 1E: Expense Management & Negative Rent Tracking**
- Created `gastos` table for property expense tracking with type classification (proportional vs 100% deductible)
- Created `rentas_negativas` table for negative rent tracking with 4-year compensation system
- Created `compensaciones_rentas_negativas` table for compensation application tracking
- Implemented `calcularGastosDeducibles` function to calculate deductible expenses (proportional expenses prorated by rental days)
- Implemented `verificarRentaNegativa` function to detect negative rents (only repairs and mortgage interest generate compensable negative rents)
- Extended storage layer with CRUD methods for expenses, negative rents, and compensations
- Implemented complete API endpoints: POST/GET /api/propiedades/:id/gastos, POST /api/propiedades/:id/calcular-gastos-deducibles, POST /api/propiedades/:id/verificar-renta-negativa, GET /api/clientes/:id/rentas-negativas-pendientes, POST /api/declaraciones/:id/aplicar-compensacion
- Backend functionality complete and operational for expense management and negative rent compensation
- Expense types: proportional (IBI, community, insurance, mortgage interest, utilities, maintenance), 100% deductible (repairs, gestoría, agency, lawyer, advertising)

**October 28, 2025 - Fase 1D: Amortization Calculation**
- Created `documentos_adquisicion` table to track all acquisition costs (purchase price, notary fees, registry fees, ITP, agency fees, improvements)
- Extended `propiedades` table with amortization fields (valor_total_adquisicion, porcentaje_construccion, valor_amortizable, amortizacion_anual)
- Extended `declaraciones_210` table with detailed amortization tracking fields
- Implemented `calcularValorAmortizable` function to calculate depreciable value (construction portion only, 3% annual)
- Implemented `calcularAmortizacion` function to calculate prorated amortization by rented days and co-owner percentage
- Extended storage layer with CRUD methods for acquisition documents and property amortization updates
- Implemented complete API endpoints: GET/POST /api/propiedades/:id/documentos-adquisicion, POST /api/propiedades/:id/calcular-valor-amortizable, POST /api/propiedades/:id/calcular-amortizacion
- Backend functionality complete and operational for tax amortization calculations

**October 28, 2025 - Fase 1C: Contract Management & Rental Tracking**
- Created `contratos_alquiler` table for rental contract tracking with tenant information, dates, rent, and business status
- Created `pagos_alquiler` table for payment tracking with status management and year filtering
- Implemented `calcularDiasAlquilados` function with overlap detection to calculate rented days per year for amortization
- Extended storage layer with CRUD methods for contracts and payments, including optional filtering and contract cancellation
- Implemented complete API endpoints: GET/POST /api/propiedades/:id/contratos, PUT /api/contratos/:id, PUT /api/contratos/:id/cancelar, GET /api/propiedades/:id/dias-alquilados, GET/POST /api/contratos/:id/pagos, PUT /api/pagos/:id
- Added placeholder UI section for rental contracts in property detail page (visible for 'alquiler' and 'mixta' property types)
- Fixed type errors in Modelo 210 result display

**October 28, 2025 - Fase 1B: Calculation Storage & History**
- Created `declaraciones_210` database table to store declaration history with full calculation details
- Enhanced calculation module to accept custom parameters (año, días, porcentaje aplicado)
- Implemented POST endpoint to calculate and save declarations for all co-owners automatically
- Implemented GET endpoint to retrieve client declaration history with year filtering
- Updated property detail page with complete calculation form (year, days, percentage)
- Added declaration history section to client page with year filter and total summary
- Calculations now display immediately after saving and refresh client history automatically
- Formula and detailed breakdown shown for each saved calculation

**October 28, 2025 - Soft Pastel Design Implementation**
- Applied exact soft pastel color scheme from reference design
- Background: Soft grayish-blue (#c5d0db, hsl(210 18% 82%))
- Cards: Very light gray-blue (hsl(210 20% 96%))
- Badge colors matching reference:
  - Imputación: Soft pink (hsl(350 30% 85%))
  - Alquiler: Soft mint green (hsl(140 30% 80%))
  - Mixta: Soft yellow/cream (hsl(45 40% 85%))
- Rounded corners: 16px (1rem) for all cards and containers
- Shadows: Very subtle (3-12% opacity) for gentle depth
- Typography: Inter font with medium gray-blue text
- Overall aesthetic: Calm, friendly, approachable professional design

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
- `/api/clientes/:id/declaraciones` - Client declaration history with year filtering
- `/api/clientes/:id/rentas-negativas-pendientes` - List pending negative rents for compensation (GET)
- `/api/propiedades/:id` - Individual property operations
- `/api/propiedades/:id/copropietarios` - Co-owner management
- `/api/propiedades/:id/modelo210` - Calculate Modelo 210 (GET - preview only)
- `/api/propiedades/:id/calcular-imputacion` - Calculate and save Modelo 210 declarations (POST)
- `/api/propiedades/:id/contratos` - Rental contracts for property (GET/POST)
- `/api/propiedades/:id/dias-alquilados` - Calculate rented days per year with overlap detection (GET)
- `/api/propiedades/:id/documentos-adquisicion` - Acquisition documents for property (GET/POST)
- `/api/propiedades/:id/calcular-valor-amortizable` - Calculate depreciable value from acquisition costs (POST)
- `/api/propiedades/:id/calcular-amortizacion` - Calculate annual amortization prorated by days and ownership (POST)
- `/api/propiedades/:id/gastos` - Register and list property expenses (GET/POST)
- `/api/propiedades/:id/calcular-gastos-deducibles` - Calculate deductible expenses with proration (POST)
- `/api/propiedades/:id/verificar-renta-negativa` - Detect and register negative rents (POST)
- `/api/contratos/:id` - Individual contract operations (GET/PUT)
- `/api/contratos/:id/cancelar` - Cancel contract with reason (PUT)
- `/api/contratos/:id/pagos` - Rental payments for contract (GET/POST)
- `/api/pagos/:id` - Individual payment operations (PUT)
- `/api/declaraciones/:id/aplicar-compensacion` - Apply negative rent compensation to declaration (POST)

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
- `propiedades` table: Property details (cadastral reference, address, purchase info, cadastral values, amortization calculations)
- `propiedad_copropietarios` junction table: Co-ownership relationships with percentage shares
- `declaraciones_210` table: Stored tax declarations with calculation details, formulas, results, and detailed amortization tracking
- `contratos_alquiler` table: Rental contract management with tenant info, dates, rent, payment terms, and business status (activo/finalizado/cancelado/renovado)
- `pagos_alquiler` table: Payment tracking with monthly/annual organization, status tracking (pendiente/pagado/atrasado/impagado), and document references
- `documentos_adquisicion` table: Acquisition cost documentation (purchase price, notary, registry, ITP, improvements) with validation status
- `gastos` table: Property expense tracking with type classification, proportional/100% deductible flags, validation status, and year organization
- `rentas_negativas` table: Negative rent tracking with 4-year compensation limit, generated fields (importe_pendiente, ano_limite), and state management (pendiente/compensado/vencido)
- `compensaciones_rentas_negativas` table: Compensation application tracking linking negative rents to declarations with amounts and dates
- Soft deletion pattern (activo/activa boolean flags for clients and properties)
- Business status fields for contracts and payments (estado column with predefined values)
- Indexed fields for common queries (NIE, client names, declaration types, declaration year, contract status, acquisition document types)

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