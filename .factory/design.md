# Scan Repair Local — visual system

## Direction: dithered reading-room print

This is an instrument for imperfect paper, not a cloud dashboard. The interface takes cues from a microfilm reader and a two-colour risograph proof: coarse halftone fields, page-edge shadows and numbered inspection marks make the act of checking a scan feel deliberate. The texture explains the product world (print being repaired) and never competes with the actual page preview.

### Palette

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#17261F` | primary text / dark mode ground |
| `--paper` | `#F7F0E3` | warm reading surface |
| `--paper-deep` | `#E9DEC9` | separators / page background |
| `--oxide` | `#9C3329` | review flags and destructive actions |
| `--moss` | `#1F5B43` | primary actions, confirmed repair |
| `--sun` | `#E5A42F` | warning/confidence cues |
| `--muted` | `#5B665E` | secondary copy |

All foreground/background pairs are selected above 4.5:1 for normal text. Dark mode swaps the paper ground for ink and uses `#F9F1E4` text with the same moss/oxide signals.

### Type, spacing, interaction

The UI uses local system fallbacks: `ui-monospace` for measurements and page identifiers, and `Georgia`/system serif for the reading-oriented display headline. The 4px rhythm scales through 8, 12, 16, 24, 32 and 48px. Controls are square-ish, generously padded and use an underprint offset rather than generic floating-card shadows. A repair adjusts the preview in place; results are marked with a stamped check. Transitions take 180ms and only opacity/transform animate. With reduced motion enabled, all transitions become immediate.

### Asset plan and provenance

One original illustration supports the download section: a close-up archival page on a copy stand, with visible halftone dots and a green inspection overlay. It was generated on 2026-08-28 via the Factory Azure `factory-image` deployment, reviewed for artifacts, converted to WebP and has no text, logos, watermarks, brands or people. Its reviewed, center-cropped 1200×630 derivative is the social card (`public/social-reading-room.webp`). It is decorative; the functional interface uses authored SVG/CSS symbols.

The four walkthrough frames are captured from the shipped sample workspace at 1280×800 and downscaled to 960×600 WebP. They document the real open, inspect, repair and export states; they are not generated imagery. `public/apple-touch-icon.png` is a 180×180 raster derivative of the product's own desktop application icon.

`public/reading-room-480.webp`, `public/reading-room-600.webp`, and `public/reading-room-800.webp` are responsive derivatives of the reviewed landing illustration, exported locally with ImageMagick at WebP quality 78 for mobile delivery.

Prompt sheet: `dithered archival print repair workbench, warm ivory paper, deep forest green and muted oxide red ink, tactile halftone dots, paper fibre and scanner glass, editorial still life, slightly top-down, honest utility, no text, no logos, no watermark, no people, no brand symbols`. Negative list: polished SaaS gradients, neon, fake UI text, hands, logos, watermarks.
