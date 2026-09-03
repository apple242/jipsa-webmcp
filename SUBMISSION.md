# Jipsa — Devpost Submission Copy

## Tagline

A real local cake marketplace where people shop visually and AI agents compare, configure, quote, and prepare the same order through WebMCP.

## What Jipsa does

Ordering a custom cake is not a normal product search. Price depends on size, filling, lettering, and extras; availability depends on a maker-specific pickup calendar; and every shop supports a different set of options. A customer usually has to open many pages and manually reconcile those constraints.

Jipsa turns that fragmented research into one shared human-and-agent workflow. A shopper can browse 20 independent cake makers through a polished storefront, inspect availability and policies, personalize a cake, see an itemized price, and confirm an order. On the same page, an AI agent can use ten small WebMCP tools to search every maker, explain why candidates were filtered out, select a store, configure the cake, calculate the exact same price shown in the UI, prepare a confirmation-bound order, and check its status.

## Why this is a strong fit for WebMCP

Custom local commerce is full of structured but inconsistent constraints. Visual browser automation has to repeatedly navigate cards, menus, forms, and calendars. WebMCP lets Jipsa expose the underlying capabilities directly while keeping the human storefront and agent actions on one shared state.

The result is not a detached chatbot or a single all-in-one automation endpoint. The agent composes purpose-built tools across the whole commerce lifecycle. Every mutation remains visible to the shopper, and the final purchase is gated by an explicit human confirmation token.

## A better human-agent experience

- A compound request checks all 20 makers across distance, exact configured price, servings, ingredients, cream colors, lettering support, and pickup inventory.
- The page shows `20 makers checked`, the three shortlisted candidates, and overlapping criterion-level rejection counts, making the recommendation inspectable.
- The best match is not hard-coded: it comes from the same catalog, inventory, validation, ranking, and pricing logic used by the storefront.
- When the agent changes lavender cream to light pink or edits the lettering, the human sees the product preview and selections update immediately.
- Search price, quote, review dialog, and persisted prototype order all use the same pricing engine.
- `prepare_order` creates only a short-lived confirmation token. `place_order` requires that exact token plus `confirmed: true`.

## What was difficult or impossible before

Before WebMCP, an agent had to infer product capabilities from presentation, revisit multiple stores, read pickup times visually, and hope that its price comparison used the same options as checkout. Jipsa gives the agent reliable, typed capabilities while preserving a normal shopping experience for the person. The human and agent can take turns refining one order instead of operating separate interfaces that drift apart.

## How it was built

Jipsa is a React and TypeScript application using the WebMCP imperative API. `src/webmcp.ts` registers ten English-language tools through `document.modelContext.registerTool()`. Each tool includes a focused description, JSON Schema input, annotations, validation, structured output, and recoverable errors.

`src/marketplace.ts` is the shared domain layer for both UI actions and WebMCP callbacks. It owns search, ranking, availability, partial configuration updates, pricing, confirmation tokens, local persistence, and the developer audit trail. `src/data.ts` contains 20 distinct sample makers. Orders are prototype records stored only in the visitor's browser; the project requires no credentials or backend.

The production site is deployed on ChatGPT Sites with `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)` headers.

## WebMCP tools

`search_local_stores`, `get_store_details`, `search_products`, `get_product_options`, `check_availability`, `configure_product`, `get_quote`, `prepare_order`, `place_order`, and `get_order_status`.

## Try it

Live app: https://jipsa.dev557938.chatgpt.site

Open the app in ChatGPT's in-app browser and ask:

> Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup on September 5, 2026 at 4 PM.

Then continue:

> Use the best one. Make the cream lavender and write “Happy Birthday Mina”.

> Actually, make the cream light pink.

The expected best match is Mellow Cake at ₩44,000 with an exact 4:00 PM pickup. The comparison should report 20 checked and three shortlisted makers. See [Testing instructions](docs/TESTING.md) for the complete verification path.

## Built with

WebMCP, ChatGPT Sites, React, TypeScript, Vite, Vitest, and CSS.
