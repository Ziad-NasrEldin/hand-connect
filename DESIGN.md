---
version: alpha
name: Herafy
description: "Arabic-first Cairo home-services directory: warm paper surfaces, confident orange accents, rounded trust cards, and mobile-first RTL workflows."
colors:
  primary: "#F26F36"
  secondary: "#6B5B4F"
  tertiary: "#F4C18A"
  neutral: "#FCF8F3"
  background: "#FCF8F3"
  foreground: "#372D25"
  card: "#FEFCF9"
  cardForeground: "#372D25"
  muted: "#EEEAE5"
  mutedForeground: "#6B5B4F"
  border: "#DBD2CA"
  destructive: "#E0543F"
  destructiveForeground: "#FFFFFF"
  hcOrange: "#F26F36"
  hcOrangeSoft: "#F4C18A"
  hcOrangeRing: "#F3D8BE"
  hcInk: "#48413C"
  hcPaper: "#FBFAF6"
  hcPaperDeep: "#F0ECE4"
  hcSurface: "#F7F4EE"
  hcCream: "#FBF5DF"
  hcRule: "#D4C9BB"
typography:
  display-xl:
    fontFamily: Cairo
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  display-latin:
    fontFamily: Archivo Black
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.05em"
  h1:
    fontFamily: Cairo
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  h2:
    fontFamily: Cairo
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h3:
    fontFamily: Cairo
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: Cairo
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.9
  body-md:
    fontFamily: Cairo
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  body-sm:
    fontFamily: Cairo
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Cairo
    fontSize: 0.78rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: 12px
  md: 14px
  lg: 16px
  xl: 18px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "#B84318"
    textColor: "#FFFFFF"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 14px
  button-primary-hover:
    backgroundColor: "#8F3515"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: 14px
  button-secondary:
    backgroundColor: "{colors.hcCream}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 14px
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: 14px
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.cardForeground}"
    rounded: "{rounded.xl}"
    padding: 24px
  card-subtle:
    backgroundColor: "{colors.hcSurface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  card-highlight:
    backgroundColor: "{colors.hcCream}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
  soft-note:
    backgroundColor: "{colors.hcCream}"
    textColor: "{colors.hcInk}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 16px
  stat-tile:
    backgroundColor: "{colors.hcPaper}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: 18px
  message-bubble-current-user:
    backgroundColor: "#B84318"
    textColor: "#FFFFFF"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
  message-bubble-other-user:
    backgroundColor: "{colors.hcSurface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 12px
---

## Overview

Herafy is a Cairo-focused home-services directory and connection layer. It helps customers find verified providers, inspect profiles, and contact them directly through WhatsApp or in-app messages. The interface must feel calm, trustworthy, Arabic-native, and phone-first.

This design file reflects the current implementation in `src/styles/globals.css`, `tailwind.config.ts`, `src/components/ui/*`, `src/i18n/locales/ar.json`, and `docs/final-sitemap.md`. It supersedes older references that mention Inter, shadcn/ui, or phone OTP as current implementation details.

Design for Herafy as a directory, not a marketplace. Do not introduce booking flows, checkout, escrow, job assignment, price negotiation, service guarantees, or provider quality guarantees.

## Colors

- **Primary / Herafy Orange (`#F26F36`):** Main action color for CTAs, active states, paid/featured accents, and important brand marks. Use it confidently but sparingly.
- **Warm Paper Background (`#FCF8F3`):** Default app canvas. Pages should feel sunlit, tactile, and calmer than a cold SaaS dashboard.
- **Card / Paper Surfaces (`#FEFCF9`, `#FBFAF6`, `#F7F4EE`):** Primary surfaces for cards, forms, sidebars, and list rows.
- **Deep Paper (`#F0ECE4`) and Rule (`#D4C9BB`):** Section separation, card borders, and subtle layout scaffolding.
- **Ink (`#372D25`, `#48413C`):** Headlines and body text. Keep high contrast and avoid light gray text on cream backgrounds.
- **Orange Soft / Ring (`#F4C18A`, `#F3D8BE`):** Secondary highlights, active nav backgrounds, badges, focus rings, and soft warnings.
- **Destructive (`#E0543F`):** Admin risk actions, rejection, report, ban, and validation errors.

Use low-saturation warm neutrals for most UI. Avoid generic blue SaaS surfaces, purple AI gradients, neon colors, or black-and-white stark minimalism.

## Typography

Herafy is Arabic-first. Cairo is the default UI and content family for Arabic screens and should be used across headings, body copy, buttons, labels, and forms.

Source Sans 3 is the Latin fallback for English variants. Archivo Black is reserved for expressive Latin display words and large numeric/stat moments only; do not use it for Arabic paragraphs.

Arabic screens should default to RTL, with generous line-height and compact-but-readable controls. Labels can be bold and small, but never cramped.

## Layout

Design mobile screens first. Start from a narrow phone viewport, then expand to tablet and desktop later.

Core layout rules:

- Use a warm full-page background with subtle radial orange/paper depth.
- Keep content in rounded cards, not hard-edged panels.
- Use sticky/top navigation sparingly on mobile and avoid crowding the header.
- Desktop role workspaces use sidebar/card navigation, but mobile workspaces use horizontal scroll navigation.
- Public discovery pages should feel open and reassuring; admin/provider pages can be denser but should remain warm and legible.
- Primary content should be scannable through cards, soft list rows, status pills, and section labels.

Spacing should be comfortable on mobile: large enough to tap, compact enough to show key decisions above the fold. Use `16px` as the base radius and `16px-24px` as the base card padding range.

## Elevation & Depth

Depth is soft and warm, never glossy. Cards use low-opacity brown/orange shadows and subtle borders. Hover states may lift slightly on desktop, but mobile screens should rely on clear hierarchy rather than hover effects.

Use:

- Soft shadows around cards and stat tiles.
- Inset border accents for active nav and selected controls.
- Warm focus rings, not electric blue rings.
- Subtle shimmer only for loading states.

Avoid heavy drop shadows, glassmorphism, extreme blur, or 3D button treatments.

## Shapes

Herafy is rounded and approachable:

- Buttons and nav chips are pill-shaped.
- Cards use `16px-18px` radius.
- Inputs use `14px` radius.
- Badges and status labels use pills.
- Message bubbles use rounded cards with direction-aware corners when possible.

Hard square corners are off-brand. Very large bubbly radii that make the app feel childish are also off-brand.

## Components

Reusable component language:

- **Brand eyebrow:** Short rounded orange gradient bar before important titles.
- **Section label:** Small bold uppercase/letter-spaced label for English; bold compact Arabic label for Arabic screens.
- **Brand panel:** Cream/paper card with soft shadow and warm border for hero, auth, forms, and important summaries.
- **Brand rule:** Thick soft horizontal rule used to anchor provider cards, hero cards, and section divisions.
- **Soft note:** Cream/orange-tinted notice for product boundaries, safety, disclosure, pending status, and no-guarantee copy.
- **Top nav link:** Pill navigation with warm active state.
- **Sidebar link:** Rounded workspace navigation item with warm active inset border.
- **Soft list item:** Provider rows, admin rows, visibility requests, conversations, and reports.
- **Stat tile:** Compact metric card with warm background, dark label, and orange/display numeric emphasis.
- **Paid badge:** Small orange-soft pill that indicates paid visibility without implying guaranteed ranking.
- **Message bubble:** Current user uses orange fill and white text; other user uses paper/surface fill and ink text.

Buttons:

- Primary actions use orange and white text.
- Secondary actions use cream/paper surfaces and ink text.
- Destructive/admin risk actions use destructive red only where necessary.
- Do not make every action orange; reserve orange for the next best action.

Forms:

- Inputs are rounded, white or paper, with warm borders.
- File upload for identity documents should feel secure and admin-only, not public/profile-like.
- Validation errors are clear and calm.

## Do's and Don'ts

Do:

- Design Arabic-only screens first.
- Default every first-pass Stitch screen to RTL mobile.
- Use real Arabic copy from `src/i18n/locales/ar.json` when possible.
- Show Herafy as a direct discovery and contact layer.
- Make customer screens simple, reassuring, and fast to scan.
- Make provider and admin screens operational but still warm.
- Include empty, loading, error, pending, rejected, paid, and organic states when the sitemap calls for them.
- Preserve product boundary language: direct contact, no platform middleman, no guaranteed outcomes.

Don't:

- Do not generate English first.
- Do not start with desktop dashboards.
- Do not invent booking calendars, checkout, escrow, service packages, quote requests, job tracking, provider assignment, or guaranteed leads.
- Do not use generic SaaS blue/purple gradients.
- Do not use cold gray admin tables as the dominant visual language.
- Do not switch Arabic screens to LTR layout.
- Do not use stock marketplace language like "hire now", "book service", "pay provider", or "guaranteed professional".

For Stitch AI, each screen prompt should include this constraint: "Arabic-only, RTL, mobile-first, Herafy warm paper/orange design system, directory/contact layer only, no booking or checkout."
