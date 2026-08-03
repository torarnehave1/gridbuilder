# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vegvisr platform end-users, largely non-technical, who want to assemble a grid-layout page or portfolio and publish it publicly without hand-writing HTML/CSS.

## Product Purpose

Grid Builder lets a user compose a page out of a cell grid (text, images, backgrounds), generate content per cell with AI, theme the page, and publish it live to a subdomain — success means a working, published page the user is happy with, reached with minimal manual layout work.

## Positioning

A grid-block layout builder with AI-assisted content/image generation per cell, live theme switching, and one-click publish that auto-creates a subdomain on vegvisr.org — tightly integrated with the Vegvisr auth and knowledge-graph ecosystem rather than a generic drag-and-drop site builder.

## Operating Context

- Auth via Vegvisr magic-link (`vegvisrAuth.ts` / `VegvisrAuthModal`), not a standalone account system.
- Publishing flow auto-creates the target subdomain rather than requiring a manual provisioning step.
- Content can be authored manually, pulled from the Vegvisr knowledge graph, or generated via AI (`AiGeneratorModal`).

## Capabilities and Constraints

- Deploys as a static Cloudflare Pages site — no server-side Functions runtime backing the built app.
- No formal design system or brand guide exists yet; visual conventions are whatever is currently implemented in code (`DESIGN.md` not yet written).
- Undecided: formal accessibility target (e.g. WCAG level) — none confirmed yet.

## Product Principles

1. Publishing must stay a single low-friction action — no manual subdomain setup exposed to the user.
2. The grid/cell model is the core authoring metaphor; refinements should reinforce it, not replace it with free-form layout.
3. AI-generated content and images are accelerators the user directs and edits, not an autonomous replacement for user intent.
4. Auth and content can originate from the wider Vegvisr ecosystem (magic-link, knowledge graph) — treat that integration as a hard constraint, not an implementation detail to abstract away.
