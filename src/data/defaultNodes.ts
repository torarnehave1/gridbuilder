import { NodeItem } from '../types';

export const DEFAULT_NODES: NodeItem[] = [
  {
    id: 'hero-main',
    label: 'Hero Main Header',
    category: 'Hero',
    info: `# Build Stunning Grid Pages Effortlessly

Welcome to **Grid Builder Studio**. Create responsive layouts with flexible slots, customizable design themes, and markdown editing.

[Get Started Now](#) · [View Documentation](#)`,
  },
  {
    id: 'feature-card-1',
    label: 'Feature: Drag & Drop',
    category: 'Features',
    info: `### 🚀 Intuitive Drag & Drop

Drag grid tiles directly into slots to instantly create multi-column grid layouts (1x1 up to 4x4).

* Zero configuration required
* Instant drop feedback`,
  },
  {
    id: 'feature-card-2',
    label: 'Feature: Design Themes',
    category: 'Features',
    info: `### 🎨 Living Theme Tokens

Switch themes seamlessly with live CSS custom properties. 

Choose from *Dark Luxury*, *Sunset Rose*, *Nordic Warmth*, or *Cyber Neon*.`,
  },
  {
    id: 'feature-card-3',
    label: 'Feature: HTML Export',
    category: 'Features',
    info: `### ⚡ Production HTML Export

Export complete, standalone HTML pages with embedded responsive CSS grid styles and zero external framework dependencies.`,
  },
  {
    id: 'cta-banner',
    label: 'Call to Action Banner',
    category: 'CTA',
    info: `## Ready to Launch Your Next Project?

Join thousands of creators using visual grid pages to showcase portfolios, products, and landing pages.

[Start Building Free](#) | [Contact Support](#)`,
  },
  {
    id: 'pricing-card-pro',
    label: 'Pricing Tier (Pro)',
    category: 'Content',
    info: `### Pro Plan
**$29 / month**

* Unlimited Grid Slots
* All Theme Catalogs
* Instant HTML & Markdown Export
* Priority Support

[Upgrade to Pro](#)`,
  },
  {
    id: 'testimonial-quote',
    label: 'Customer Testimonial',
    category: 'Content',
    info: `> "This grid builder completely transformed how we assemble landing pages. The drag-and-drop slots make prototyping lightning fast!"

— **Elena Rostova**, *Lead Product Designer*`,
  },
  {
    id: 'stat-metric-1',
    label: 'Key Metric Display',
    category: 'Content',
    info: `# 99.9%
### Guaranteed Uptime & Speed

Built with modern browser standards for optimal performance and accessibility.`,
  },
  {
    id: 'media-showcase',
    label: 'Image & Headline',
    category: 'Media',
    info: `![Modern Dashboard Illustration](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80)

### High Density Data Visuals
Interactive responsive widgets crafted for high-impact web presentations.`,
  },
  {
    id: 'lux-life-showcase',
    label: 'Lux Life Executive Showcase',
    category: 'Brand Catalog',
    info: `# Lux Life Brand Catalog
## Elegance & Refinement

Experience bespoke luxury with custom typography, rich gold and emerald accents, and high-contrast editorial layouts.

[Explore Catalog Collection](#) · [View Heritage Series](#)`,
  },
  {
    id: 'lux-life-editorial',
    label: 'Lux Life Editorial Quote',
    category: 'Brand Catalog',
    info: `> "True luxury resides in the unspoken detail — the harmony of space, light, and pristine craft."

— **Lux Life Brand Manifesto**
*Graph Node ID: f2dec331-d905-42ec-9880-3de513fc9d95*`,
  },
  {
    id: 'node-intro-lydmora',
    label: 'Introduksjon til Lydmora',
    category: 'Imported Graphs',
    graphId: '9e221c67-f00d-451f-a1e3-a5fb95f40107',
    sourceNodeId: 'node-intro-lydmora',
    expectedVersion: 29,
    info: `### Introduksjon til Lydmora
*Source Graph: Lydmora — Markedsføringsgraf*

# Introduksjon til Lydmora

[FANCY | font-size: 3.5em; color: #2c3e50; text-align: center]
Lydmora — En Resonant Lydrom-Opplevelse
[END FANCY]

Velkommen til Lydmora, en transformativ opplevelse designet for å ta deg dypere inn i lydens verden.`,
  },
  {
    id: 'flexbox-cards-showcase',
    label: 'Flexbox Cards Showcase',
    category: 'Features',
    graphId: '9e221c67-f00d-451f-a1e3-a5fb95f40107',
    sourceNodeId: 'node-intro-lydmora',
    expectedVersion: 29,
    info: `### Hva som IKKE endres
*Source Graph: Knowledge Graph*

[FANCY | font-size: 1.8em; text-align: center]
Dette rører vi ikke
[END FANCY]

[FLEXBOX-CARDS]
[CARD | variant=accent; animate=lift]
**Nettsiden din**
Ligger hos Kajabi, og blir værende. Samme side, samme innhold, samme innlogging.
[END CARD]

[CARD | variant=accent2; animate=glow]
**E-posten din**
Går via Google, og forblir helt uendret. Du sender og mottar akkurat som nå.
[END CARD]

[CARD | variant=gradient; animate=scale]
**Domene & DNS**
Peker trygt videre uten nedetid eller forstyrrelser.
[END CARD]

[CARD | variant=outline; animate=pulse]
**Det du har i dag**
Alle eksisterende oppføringer kopieres likt over. Ingenting forsvinner.
[END CARD]
[END FLEXBOX]`,
  },
  {
    id: 'faq-accordion',
    label: 'Frequently Asked Questions',
    category: 'Content',
    info: `### Frequently Asked Questions

**Q: Can I export the code?**
A: Yes! Click *Export HTML* in the top bar to get a single self-contained HTML file.

**Q: Is it responsive?**
A: All grid layouts collapse automatically into clean single columns on mobile devices.`,
  },
  {
    id: 'code-snippet',
    label: 'Code Block Highlight',
    category: 'Content',
    info: `### Developer Friendly

\`\`\`css
/* Custom CSS Variables */
:root {
  --accent: #d4af37;
  --radius: 16px;
}
\`\`\`

Easily embed code snippets or customized styling rules.`,
  },
];
