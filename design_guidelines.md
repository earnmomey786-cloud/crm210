# Design Guidelines: Sistema de Gestión de Clientes - Gestoría

## Design Approach

**Reference-Based with Specific Aesthetic Requirements**

Following the provided screenshot inspiration, this design will feature:
- Soft pastel color palette (light blue, mint green, soft pink, cream)
- Rounded cards with gentle shadows
- Clean, modern typography with generous spacing
- Friendly, approachable aesthetic for a professional business application

## Typography

**Font Family:**
- Primary: 'Inter' (via Google Fonts) - clean, modern, excellent readability
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Type Scale:**
- Page titles: text-3xl font-bold (30px)
- Section headers: text-2xl font-semibold (24px)
- Card titles: text-lg font-semibold (18px)
- Body text: text-base (16px)
- Labels: text-sm font-medium (14px)
- Helper text: text-xs (12px)
- All text in dark gray (#2D3748) for soft contrast

## Layout System

**Spacing Primitives:**
Core spacing units: 2, 4, 6, 8, 12, 16, 20
- Component padding: p-6, p-8
- Card spacing: gap-4, gap-6
- Section margins: mb-8, mb-12
- Page padding: p-8, p-12

**Container Structure:**
- Max width: max-w-7xl centered
- Page padding: px-8 py-12
- Responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Cards & Containers
**Base Card:**
- Background: White
- Border radius: rounded-2xl (16px)
- Shadow: shadow-md with soft blur
- Padding: p-6 or p-8
- Hover state: shadow-lg transition-shadow duration-300

**List Cards:**
- Minimal borders (border border-gray-100)
- Rounded: rounded-xl
- Padding: p-4
- Hover: subtle background shift to gray-50

### Navigation
**Top Bar:**
- Fixed header with backdrop-blur
- Height: h-16
- Logo left, navigation center, user actions right
- Background: white with subtle shadow

**Breadcrumb Trail:**
- Text-sm with chevron separators
- Interactive previous levels
- Current page in darker weight

**Back Button:**
- Left-aligned with arrow icon
- Text-base font-medium
- Subtle hover state

### Buttons
**Primary Action:**
- Rounded: rounded-lg (12px)
- Padding: px-6 py-3
- Font: font-semibold
- Gradient backgrounds matching pastel theme
- Soft shadows

**Secondary Action:**
- Border: border-2
- Background: white
- Rounded: rounded-lg
- Padding: px-6 py-3

**Icon Buttons:**
- Circular: rounded-full
- Size: w-10 h-10
- Centered icons

### Forms
**Input Fields:**
- Border: border-2 border-gray-200
- Rounded: rounded-lg
- Padding: px-4 py-3
- Focus: ring-2 with pastel accent color
- Labels: text-sm font-medium mb-2
- Required indicator: Asterisk in soft red

**Radio Buttons & Checkboxes:**
- Custom styled with pastel accent colors
- Larger touch targets (w-5 h-5)
- Clear spacing between options

**Select Dropdowns:**
- Match input styling
- Custom arrow icon
- Rounded corners

### Data Display
**Tables:**
- No heavy borders
- Alternating row backgrounds (subtle gray-50/white)
- Header: font-semibold with slight background tint
- Row padding: py-4
- Rounded corners on container

**Data Cards (for properties/clients):**
- Grid layout: grid gap-4
- Each card shows key info
- Click-through indicator (arrow or chevron)
- Badge for status/type (rounded-full px-3 py-1)

**Stat Boxes:**
- Large numbers: text-3xl font-bold
- Label below: text-sm text-gray-600
- Icon accent in corner
- Rounded-xl card container

### Status Indicators
**Badges:**
- Pill shape: rounded-full
- Padding: px-3 py-1
- Font: text-xs font-medium
- Color-coded by type:
  - "Imputación": Soft blue background
  - "Alquiler": Soft green background
  - "Mixta": Soft purple background
- Active status: soft green, Inactive: soft gray

### Modals & Overlays
**Modal Dialogs:**
- Backdrop: backdrop-blur-sm with opacity
- Card: large rounded-2xl
- Max width: max-w-2xl
- Shadow: shadow-2xl
- Close button: top-right, subtle gray

### Empty States
**No Data Displays:**
- Centered icon (large, soft color)
- Heading: text-xl font-semibold
- Descriptive text: text-gray-600
- Call-to-action button below

## Page Layouts

### Client List (Main Screen)
- Header with search bar (prominent, rounded-xl)
- "+ Nuevo Cliente" button (top-right, primary style)
- Grid of client cards OR table view toggle
- Each client card: Name, NIE, property count, click-through arrow

### Client Detail → Properties View
- Breadcrumb navigation
- Client header card (name, NIE, contact info summary)
- Grid of property cards below
- Each property card: Address, type badge, declaration type badge

### Property Detail View
- Full-width detail card
- Section organization with subtle dividers
- Edit mode toggle
- Co-ownership percentage display (visual progress bars)
- Clear CTA for "Calcular Modelo 210"

### Form Pages
- Single column layout: max-w-2xl centered
- Grouped sections with subtle backgrounds
- Field groups with spacing
- Sticky action buttons (bottom or floating)

## Icons
**Library:** Heroicons (outline style for most, solid for emphasis)
- Consistent stroke width
- Size: w-5 h-5 for inline, w-6 h-6 for buttons
- Color: Match text color or accent

## Images
No hero images required for this admin/business application. All visual interest comes from the soft color palette, rounded cards, and clean layout.

## Accessibility
- All interactive elements: minimum 44px touch target
- Form labels properly associated
- Focus states clearly visible with ring-2
- Color is not the only indicator (use icons/text)
- ARIA labels on icon buttons

## Responsive Behavior
- Mobile: Single column, full-width cards, stacked forms
- Tablet: 2-column grids where appropriate
- Desktop: Full 3-column layouts for card grids
- Navigation: Hamburger menu on mobile, full nav on desktop