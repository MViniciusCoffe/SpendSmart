# Frontend Refactor Plan - SpendSmart

## Overview

Complete refactor of the frontend to modern architecture with design system, responsive design, and optimized Next.js patterns.

## Goals

- [ ] Modern design system (Mercury-inspired, dark theme)
- [ ] Responsive design with proper @media breakpoints
- [ ] Organized folder structure (src/app, components, styles, hooks, lib)
- [ ] CSS Modules + Design Tokens architecture
- [ ] Reusable component library (Button, Card, Input, Modal, etc.)
- [ ] Status page with Next.js optimizations
- [ ] All code in English
- [ ] TypeScript migration ready (JSDoc for now)

## Current State Analysis

- Pages Router (`pages/`) with CSS Modules
- Components in `components/` (Navbar, withAuth)
- Services in `services/` (business logic)
- Tests in `tests/` (unit, integration, regression)
- Scripts in `scripts/` and `infra/scripts/`
- Supabase migrations in `supabase/migrations/`

## Target Architecture (Next.js 13+ App Router)

```
src/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   ├── globals.css               # Global styles + tokens import
│   ├── layout.js                 # Root layout with providers
│   ├── providers.js              # Context providers (Auth, Toast)
│   ├── status/                   # Status Page
│   │   ├── page.js               # Main status page
│   │   ├── loading.js            # Streaming loading UI
│   │   ├── error.js              # Error boundary
│   │   └── components/           # Status-specific components
│   ├── dashboard/                # Dashboard
│   │   ├── page.js
│   │   ├── components/           # Dashboard components
│   │   └── hooks/                # Dashboard-specific hooks
│   ├── transactions/             # Transactions (expenses + income)
│   │   ├── page.js               # List view
│   │   ├── create/               # Create transaction
│   │   │   └── page.js
│   │   ├── edit/
│   │   │   └── page.js
│   │   ├── components/
│   │   └── hooks/
│   ├── categories/               # Categories CRUD
│   │   ├── page.js
│   │   ├── create/
│   │   ├── edit/
│   │   └── components/
│   ├── settings/                 # Account settings
│   │   ├── page.js
│   │   └── components/
│   ├── login/
│   │   └── page.js
│   └── register/
│       └── page.js
│
├── components/                    # Shared components
│   ├── ui/                       # Design System (Atoms)
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── InputSelect/
│   │   ├── InputDate/
│   │   ├── Badge/
│   │   ├── Avatar/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Avatar/
│   │   ├── Divider/
│   │   ├── Spinner/
│   │   └── index.js
│   ├── layout/                   # Layout components (Organisms)
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── PageContainer/
│   │   ├── PageHeader/
│   │   └── index.js
│   ├── forms/                    # Form composites (Molecules)
│   │   ├── TransactionForm/
│   │   ├── CategoryForm/
│   │   └── index.js
│   ├── feedback/                 # Feedback components
│   │   ├── Toast/
│   │   ├── Alert/
│   │   ├── EmptyState/
│   │   ├── Loading/
│   │   └── index.js
│   └── index.js                  # Barrel exports
│
├── styles/                       # Design System Styles
│   ├── tokens/                   # Design Tokens (CSS Custom Properties)
│   │   ├── colors.css
│   │   ├── spacing.css
│   │   ├── typography.css
│   │   ├── shadows.css
│   │   ├── breakpoints.css
│   │   ├── radius.css
│   │   ├── z-index.css
│   │   ├── transitions.css
│   │   └── index.css
│   ├── globals.css               # Reset + base styles
│   ├── utilities.css             # Utility classes
│   └── index.css                 # Main entry (imports all)
│
├── components/                    # Shared components (duplicate removed - see above)
│
├── hooks/                        # Custom React Hooks
│   ├── useAuth.js
│   ├── useTransactions.js
│   ├── useCategories.js
│   ├── useToast.js
│   ├── useMediaQuery.js
│   ├── useDebounce.js
│   └── index.js
│
├── lib/                          # Core utilities & config
│   ├── supabase.js               # Supabase client
│   ├── api.js                    # API wrapper (fetch wrapper)
│   ├── supabaseServer.js         # Server-side Supabase (for Server Components)
│   ├── validators.js             # Validation helpers
│   ├── formatters.js             # formatCurrency, formatDate, etc.
│   ├── constants.js              # App constants
│   └── utils.js                  # General utilities
│
├── services/                     # Business Logic (keep existing)
│   ├── authServices.js
│   ├── categoryService.js
│   ├── transactionService.js
│   ├── profileService.js
│   └── utils/
│       ├── baseService.js
│       ├── logger.js
│       ├── mappers.js
│       ├── validators.js
│       └── utils.js
│
├── contexts/                     # React Contexts
│   ├── AuthContext.jsx
│   ├── ToastContext.jsx
│   └── index.js
│
├── providers/                    # Provider components
│   ├── AuthProvider.jsx
│   ├── ToastProvider.jsx
│   └── index.js
│
├── types/                        # TypeScript types / JSDoc typedefs
│   ├── transaction.js
│   ├── category.js
│   ├── user.js
│   └── index.js
│
├── utils/                        # Pure utility functions
│   ├── date.js
│   ├── currency.js
│   ├── string.js
│   └── index.js
│
└── config/                       # Configuration
    ├── site.js                   # Site metadata
    └── theme.js                  # Theme config

```

## Migration Strategy

### Phase 1: Foundation (Week 1)

- [ ] Create folder structure
- [ ] Move existing files to new structure
- [ ] Create Design Tokens (colors, spacing, typography, etc.)
- [ ] Create globals.css + utilities.css
- [ ] Create base components: Button, Card, Badge, Input

### Phase 2: Layout & Navigation (Week 1-2)

- [ ] Header component (responsive: mobile drawer + desktop sidebar)
- [ ] PageContainer / PageHeader layout components
- [ ] Responsive Sidebar (mobile drawer + desktop fixed)
- [ ] Navigation with active states

### Phase 3: Core Pages (Week 2-3)

- [ ] Status Page (with Next.js optimizations)
- [ ] Dashboard (balance cards, charts, recent transactions)
- [ ] Transactions page (list, create, edit)
- [ ] Categories CRUD
- [ ] Settings page

### Phase 4: Polish (Week 3-4)

- [ ] Forms with validation (react-hook-form + zod)
- [ ] Toast system (replaces alert)
- [ ] Loading states + Skeletons
- [ ] Empty states
- [ ] Error boundaries
- [ ] Accessibility audit
- [ ] Performance optimization

## Design Tokens Specification

### Colors (Dark Theme - Mercury Inspired)

```css
:root {
  /* Backgrounds */
  --color-bg-primary: #0a0a0a; /* Main background */
  --color-bg-secondary: #121212; /* Cards, surfaces */
  --color-bg-tertiary: #1a1a1a; /* Hover states */
  --color-bg-hover: #222222;

  /* Mercury Accent */
  --color-mercury: #00d4aa;
  --color-mercury-hover: #00e8bb;
  --color-mercury-muted: rgba(0, 212, 170, 0.1);

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #666666;
  --color-text-inverse: #0a0a0a;

  /* Borders */
  --color-border: #2a2a2a;
  --color-border-hover: #3a3a3a;
  --color-border-focus: var(--color-mercury);

  /* Semantic */
  --color-success: #00d4aa;
  --color-warning: #ffb800;
  --color-error: #ff4757;
  --color-info: #3742fa;

  /* Income/Expense */
  --color-income: #00d4aa;
  --color-expense: #ff4757;

  /* Overlay */
  --color-overlay: rgba(0, 0, 0, 0.7);
}
```

### Spacing Scale (4px base)

```css
--space-0: 0;
--space-1: 4px; /* 0.25rem */
--space-2: 8px; /* 0.5rem */
--space-3: 12px; /* 0.75rem */
--space-4: 16px; /* 1rem */
--space-5: 20px; /* 1.25rem */
--space-6: 24px; /* 1.5rem */
--space-8: 32px; /* 2rem */
--space-10: 40px; /* 2.5rem */
--space-12: 48px; /* 3rem */
--space-16: 64px; /* 4rem */
```

### Typography

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */

--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Breakpoints (Mobile First)

```css
--bp-xs: 320px;
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(0, 212, 170, 0.3);
```

### Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-toast: 800;
```

## Component Checklist

### Atoms (ui/)

- [ ] Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg; states: loading, disabled)
- [ ] Card (variants: default, bordered, elevated)
- [ ] Input (text, email, password, number; with label, error, helper text)
- [ ] InputSelect (native select wrapper)
- [ ] InputDate (date picker)
- [ ] Textarea
- [ ] Checkbox / Radio
- [ ] Switch/Toggle
- [ ] Badge (variants: default, success, warning, error, info)
- [ ] Avatar (image, fallback initials, sizes)
- [ ] AvatarGroup
- [ ] Divider
- [ ] Spinner (sizes: sm, md, lg)
- [ ] Icon (wrapper for lucide-react or similar)
- [ ] Tooltip
- [ ] Popover

### Molecules (forms/, feedback/)

- [ ] TransactionForm (create/edit)
- [ ] CategoryForm
- [ ] SearchInput
- [ ] FilterChips
- [ ] Toast (toast, success, error, warning, info)
- [ ] Alert (inline)
- [ ] EmptyState (icon, title, description, action)
- [ ] LoadingSkeleton (card, table, list variants)
- [ ] ConfirmDialog
- [ ] DropdownMenu

### Organisms (layout/, forms/)

- [ ] Header (logo, user menu, mobile menu button)
- [ ] Sidebar (navigation, collapsible, mobile drawer)
- [ ] PageContainer (max-width, padding)
- [ ] PageHeader (title, description, actions)
- [ ] SidebarNavigation (with active state, icons)
- [ ] Table (sortable, pagination, row actions)
- - TransactionTable
- - CategoryTable
- [ ] ChartContainer (wrapper for chart.js)

### Templates (app/)

- [ ] AuthLayout (centered card)
- [ ] DashboardLayout (header + sidebar + content)
- [ ] SettingsLayout
- [ ] Auth pages (login, register)

### Pages (app/)

- [ ] Home (marketing)
- [ ] Login / Register
- [ ] Dashboard
- [ ] Transactions (list, create, edit)
- [ ] Categories (list, create, edit)
- [ ] Settings (profile, password, delete account)
- [ ] Status Page (health checks, metrics)

## Next.js Optimizations for Status Page

```javascript
// app/status/page.js
export const dynamic = "force-dynamic" // or 'force-static' with revalidate
export const revalidate = 60 // ISR: regenerate every 60s
export const fetchCache = "force-no-store" // or 'force-cache'

// Streaming with loading.js + Suspense
// app/status/loading.js - shows immediately
// app/status/error.js - error boundary
```

## Checklist for Completion

### Infrastructure

- [ ] Folder structure created
- [ ] Design tokens implemented
- [ ] Globals + utilities CSS
- [ ] ESLint/Prettier configured for new structure
- [ ] Path aliases configured (@/components, @/styles, @/lib, etc.)

### Design System

- [ ] All design tokens defined
- [ ] Button component (all variants/sizes/states)
- [ ] Card component
- [ ] Input/Textarea components
- [ ] Badge component
- [ ] Badge component
- [ ] Spinner component
- [ ] Icon system

### Layout

- [ ] Header (responsive)
- [ ] Sidebar (responsive)
- [ ] PageContainer
- [ ] PageHeader

### Pages

- [ ] Status page (optimized)
- [ ] Dashboard
- [ ] Transactions
- [ ] Categories
- [ ] Settings
- [ ] Login/Register

### Features

- [ ] Toast system (replace alert)
- [ ] Form validation (react-hook-form + zod)
- [ ] Loading states
- [ ] Empty states
- [ ] Error boundaries
- [ ] Dark theme only (light mode optional)

### Quality

- [ ] ESLint/Prettier passing
- [ ] Tests passing
- [ ] Accessibility (WCAG AA)
- [ ] Performance (Lighthouse > 90)
- [ ] Bundle size optimized

## Notes

- Keep existing `services/` as-is (business logic separate)
- Keep `tests/` structure, update paths
- Use `next/font` for font optimization
- Use `next/image` for any images
- Use `next/script` for third-party scripts
- Server Components by default, Client Components only when needed
- Server Actions for mutations (Next.js 14+)
- Beware with exposed error logs
