# SmartFabrication — Rural-Friendly Bilingual Localization Implementation Plan

## 1. Executive Summary & Objective

The objective of this initiative is to convert the customer-facing SmartFabrication application into a modern, accessible, mobile-first **Hindi + English bilingual website** tailored for rural India, village homeowners, farmers building houses, local contractors, and small-town families.

### Core Tenets
1. **Zero Breaking Changes**: Existing Supabase schemas, PostgreSQL RLS policies, Cloudinary assets, 315 catalog products, REST APIs (`/api/v1/*`), and Next.js App Router architecture remain 100% intact.
2. **Rural-Friendly Tone**: Simple colloquial Hindi combined with universally recognized English market terms (Gate, Grill, Steel, Design, WhatsApp, Feet, Inches) rather than overly Sanskritized/formal dictionary Hindi.
3. **Seamless Language Switching**:
   - Prominent header switch: `हिंदी | English` (no flags).
   - Saved in cookies (`sf_locale`) and `localStorage`.
   - Never overrides manual selection.
   - Dynamic in-place switching that **never wipes out active form inputs, measurements, search queries, or cart items**.
4. **Feet + Inches First**: The price calculator defaults to Feet + Inches (`ft_in`) with conversational questions ("गेट की चौड़ाई कितनी है?").
5. **Clear Order Tracking**: Seven simple, transparent project milestones in Hindi mapped directly to existing PostgreSQL order states.

---

## 2. System Architecture & Internationalization (i18n)

### 2.1 Locale Storage & Persistence
- **Cookie Key**: `sf_locale` (`'hi'` | `'en'`).
- **LocalStorage Key**: `sf_locale_v1`.
- **Default for first-time visitors**: `'hi'` (Hindi).
- **Hydration Safe**: SSR reads cookie via Next.js `cookies()`; client context initializes from cookie or storage without layout shift or mismatch.

### 2.2 Translation Architecture
- **Location**: `src/lib/i18n/`
  - `types.ts`: Strongly-typed translation dictionary schema (`TranslationKeys`).
  - `dictionaries/hi.ts`: Hindi rural-friendly translations.
  - `dictionaries/en.ts`: English clear translations.
  - `locale-context.tsx`: `LocaleProvider`, `useLocale()` hook with reactive `t(key, params)` helper and `setLocale(locale)`.
  - `server.ts`: Server-side `getLocale()` reading cookie for SSR rendering.
- **Header Trigger**: `src/features/i18n/language-switcher.tsx`
  - Compact, high-contrast, accessible toggle button displayed in the main header across desktop and mobile viewports.

---

## 3. Phased Implementation Roadmap

| Stage | Focus Area | Key Deliverables |
| :--- | :--- | :--- |
| **Stage 1** | Codebase Audit & Planning | Implementation plan, translation guide, UX specifications. |
| **Stage 2** | Core i18n Engine & Switcher | `types.ts`, `hi.ts`, `en.ts`, `LocaleProvider`, `LanguageSwitcher` in header. |
| **Stage 3** | Homepage, Nav & Footer | Conversational Hindi hero ("अपने घर के लिए मजबूत और सुंदर गेट बनवाएँ"), trust points, navigation, footer. |
| **Stage 4** | Catalog & Product Details | Bilingual design titles ("लोहे का मेन गेट (Iron Main Gate)"), Hindi category labels, bilingual search query support. |
| **Stage 5** | Price Calculator & Enquiry | Calculator defaults to Feet + Inches (`ft_in`), simple prompts ("गेट की चौड़ाई कितनी है?"), localized Enquiry form. |
| **Stage 6** | Order Tracking & Account | Seven Hindi project stages (ऑर्डर मिल गया → नाप की जाँच → काम शुरू हो गया → सामान तैयार है → डिलीवरी के लिए निकला → सामान पहुँच गया → काम पूरा हो गया). |
| **Stage 7** | Admin CMS Localization | Documentation and maintainable dictionary hooks for managing translations from existing CMS without schema breakage. |
| **Stage 8** | Comprehensive Testing | Vitest unit/integration suite, Next.js Turbopack build, TypeScript checks, security/doc gates. |
| **Stage 9** | Documentation & Release | Test results summary, progress register update, deployment to GitHub and Vercel. |
