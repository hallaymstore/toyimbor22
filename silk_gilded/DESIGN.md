# Design System: Modern Silk Road Elegance

## 1. Overview & Creative North Star: "The Digital Concierge"
This design system is built to transcend the transactional nature of a marketplace, evolving instead into a curated, editorial experience. Our Creative North Star is **"The Digital Concierge."** We move away from the rigid, boxed-in layouts of traditional e-commerce and toward the fluid, breathing compositions of high-end fashion glossies.

To achieve this, we utilize **Intentional Asymmetry**. Hero sections should feature overlapping elements—such as a `surface-container-lowest` image card partially masking a `display-lg` headline—to create a sense of depth and bespoke craftsmanship. The goal is "Modern Silk Road Elegance": a marriage of clean, minimalist space with the opulent warmth of champagne and emerald accents.

---

## 2. Colors & Surface Philosophy
The palette is rooted in light and air, using gold not as a "yellow" but as a light-reflecting metallic, and emerald as a grounded, sophisticated anchor.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through background shifts. For example, a `surface` hero section transitions into a `surface-container-low` featured vendors section. The eye should perceive change through tonal depth, not structural lines.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine stationery.
*   **Base:** `surface` (#faf9f8) for the main canvas.
*   **Depth:** Use `surface-container-low` to group related content.
*   **Focus:** Use `surface-container-lowest` (#ffffff) for floating cards or interactive elements to create a "lifted" effect.

### The "Glass & Gradient" Rule
To evoke "Silk Road" luxury, utilize Glassmorphism on navigation bars and floating action menus. Use `surface-container-lowest` at 80% opacity with a `24px` backdrop blur. 
*   **Signature Gradient:** For primary CTAs, use a subtle linear gradient from `primary` (#735c00) to `primary_container` (#d4af37) at a 135-degree angle to mimic the sheen of raw silk.

---

## 3. Typography: Royal Editorial
The type system creates a dialogue between heritage (`Noto Serif`) and modern utility (`Inter`).

*   **Display & Headlines (Noto Serif):** These are your "Statement Pieces." Use `display-lg` for hero titles with generous letter-spacing (-0.02em) to evoke a royal, authoritative feel.
*   **Titles & Body (Inter):** Inter provides the "Functional Backbone." Use `title-md` for navigation and sub-headers to ensure the UI feels contemporary and accessible.
*   **The Contrast Rule:** Never use Noto Serif for functional labels or small body text. It is reserved for storytelling and emotional resonance. Body text should always be `on-surface-variant` (#4d4635) to maintain a softer, more organic reading experience than pure black.

---

## 4. Elevation & Depth
We reject heavy, muddy shadows. We embrace **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a 0dp elevation feel that is visually distinct through color alone.
*   **Ambient Shadows:** If a card must float (e.g., a modal or a primary hover state), use an extra-diffused shadow: `offset-y: 12px, blur: 40px, color: rgba(115, 92, 0, 0.06)`. Note the use of a tinted shadow (using the primary hue) rather than grey.
*   **The "Ghost Border":** If accessibility requires a container boundary, use `outline-variant` at 15% opacity. It should be felt, not seen.
*   **Glassmorphism:** Use for "floating" elements like price tags over images or sticky headers to keep the UI "light and airy."

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`), `on_primary` text, `4px` (DEFAULT) radius. No border.
*   **Secondary:** Ghost style. `title-sm` text in `primary`, no background. On hover, a subtle `surface-container-high` background appears.
*   **Tertiary:** Emerald Accents. Use `tertiary` (#2b6954) for "Save to Wishlist" or "Inquiry Sent" states to provide a calm, high-contrast confirmation.

### Cards (The "Editorial Frame")
*   **Rules:** No borders. `8px` (lg) corner radius. Use `surface-container-lowest` for the card body. 
*   **Spacing:** Double the standard padding (use `1.5rem` minimum) to ensure "Luxury Breathing Room."

### Input Fields
*   **Style:** Minimalist. Only a bottom-aligned `outline-variant` line. Labels in `label-md` Inter, using `on-surface-variant`.
*   **Focus State:** The bottom line transitions to `primary` (Gold) with a `2px` thickness.

### Signature Component: The "Curated Gallery"
Instead of a standard grid, use a masonry layout with varying aspect ratios. Small labels in `tertiary` (Emerald) should be used as "Verified" or "Luxury" badges, placed in the top-right corner using a `9999px` (full) pill shape.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use whitespace as a functional element. If a section feels crowded, double the padding rather than adding a divider.
*   **Do** use `Noto Serif` in italics for secondary headlines to add a "hand-written" editorial touch.
*   **Do** use Emerald (`tertiary`) only for small "moments of delight"—icons, badges, or success states.

### Don't
*   **Don't** use 100% black (#000000). Use `on_surface` (#1a1c1c) for text to keep the palette sophisticated.
*   **Don't** use `9999px` pill shapes for primary buttons; keep them to the `4px` or `8px` scale to maintain a structural, architectural feel.
*   **Don't** use dividers. If you feel the need for a line, try a 16px vertical gap instead.