# Jipsa

Jipsa is a consumer marketplace for custom cakes from trusted local makers. Customers can browse and personalize an order like any modern shop, or ask ChatGPT to compare options and prepare it for confirmation.

> A real shopping flow for people, with structured ordering capabilities for ChatGPT.

Live storefront: https://jipsa.dev557938.chatgpt.site

This repository is a standalone submission for **The WebMCP Challenge**. The current catalog, availability, and orders are sample data; no API keys or production credentials are required.

## The problem

Ordering a custom item from a local maker is a high-friction research task. A customer normally opens many stores, checks size and price tables, looks for customization rules, compares pickup calendars, and repeats the process when one constraint fails. A browser agent can click through those pages, but visual actuation is slow and error-prone.

Jipsa makes those capabilities explicit. The page registers small, composable WebMCP tools for search, store discovery, option inspection, availability, configuration, quoting, safe order preparation, order placement, and status. The tools operate on the same catalog and state as the human interface.

## Why WebMCP matters

WebMCP turns the marketplace from pages an agent must interpret into capabilities it can reliably use. A single structured search checks all 20 cake makers across distance, exact configured price, serving count, ingredients, cream colors, lettering support, and pickup inventory. The page shows both the shortlist and criterion-level rejection counts so the comparison is inspectable rather than implied.

Every mutating tool updates the visible interface. If an agent changes a cake from lavender to light pink, the product photography and option selection change immediately for the human too. `prepare_order` never creates an order. It produces a short-lived confirmation token and opens the final human review. `place_order` requires both that exact token and `confirmed: true`.

The implementation follows the current `document.modelContext` imperative API. In browsers without WebMCP enabled, the **Shop with ChatGPT** drawer can rehearse the same local tool definitions and execution functions without pretending that a protocol connection exists.

## Human experience

- Browse a believable marketplace with 20 distinct cake makers.
- See distance, price, rating, description, imagery, and current availability at a glance.
- Open a maker, configure size, flavor, filling, design, cream color, lettering, and pickup time.
- Watch cake photography respond to cream-color changes.
- Receive an itemized quote and explicitly confirm the final order.
- Reopen locally persisted prototype orders from the header.

## Agent experience

Use the prepared flow in **Shop with ChatGPT**, or open the site in a WebMCP-capable browser and ask:

> Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup this Saturday at 4 PM.

Then continue:

> Use the best one. Make the cream lavender and write “Happy Birthday Mina”.

> Actually, make the cream light pink.

The agent receives an exact match plus transparent near-time alternatives, changes only the requested fields, calculates a real option-based quote, prepares the order, and waits for final human confirmation. Search estimates and the final order both use the same pricing engine.

## Available WebMCP tools

| Tool | Responsibility | Visible state change |
| --- | --- | --- |
| `search_local_stores` | Filter and rank all 20 makers against compound constraints | Comparison breakdown, ranked results, and explanation |
| `get_store_details` | Retrieve capabilities and select a store | Opens the product configurator |
| `search_products` | Search product, flavor, filling, and store text | None |
| `get_product_options` | Return valid configuration options | None |
| `check_availability` | Check exact time and return alternatives | None |
| `configure_product` | Create or partially update configuration | Live image, options, lettering, and pickup state |
| `get_quote` | Calculate an itemized option-based price | Quote card and current total |
| `prepare_order` | Prepare a confirmation-bound summary | Opens final review; does not create an order |
| `place_order` | Persist a confirmed prototype order | Success state and order ledger |
| `get_order_status` | Read status for a persisted order | None |

Every tool has an English name and description, JSON Schema input, validation, structured JSON output, and actionable recoverable errors. The Developer Audit inside the ChatGPT shopping drawer exposes tool name, arguments, result, state change, and error.

## Architecture

```text
Human marketplace UI ─┐
                      ├─ shared marketplace store ─ catalog + pricing + inventory
WebMCP tool callbacks ┘               │
                                      ├─ visible configuration / quote state
                                      └─ localStorage prototype order ledger
```

- `src/data.ts` contains 20 cake makers with distinct prices, options, lead times, and pickup slots.
- `src/marketplace.ts` contains deterministic search, ranking, pricing, validation, confirmation, persistence, and audit behavior.
- `src/webmcp.ts` defines and registers the 10 WebMCP tools through `document.modelContext.registerTool()`.
- `src/App.tsx` renders the storefront, live configurator, ChatGPT shopping drawer, confirmation, and order ledger.
- `src/marketplace.test.ts` covers ranking, partial updates, useful errors, and confirmation-gated persistence.

The submission intentionally focuses on one complete vertical—custom cakes—rather than presenting unfinished categories. Every visible maker participates in the same search, configuration, pricing, and pickup flow.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. For native WebMCP testing, use ChatGPT's in-app browser or a Chrome build with WebMCP testing enabled. The page uses local sample data, so there is no backend setup.

`vercel.json` and `netlify.toml` include the origin-cluster and `tools` permissions headers required for a secure WebMCP deployment.

## Verify

```bash
npm test
npm run build
```

## Demo flow

1. Land directly in the consumer marketplace and briefly browse a store manually.
2. Open Shop with ChatGPT and run the prepared compound request.
3. Show `20 makers checked`, the criterion-level rejection counts, and the ranked exact and near-time matches.
4. Select the best match and configure lavender cream with “Happy Birthday Mina”.
5. Correct only the cream color to light pink and point out that all other fields persist.
6. Calculate the itemized quote and prepare the order.
7. Use the final human confirmation dialog to call `place_order` and create a persisted prototype order.
8. Open Developer Audit to show the composed tool calls, arguments, results, and state changes.
9. End on the shared storefront state to show that the agent's choices remain visible to the human.

## Public repository safety

- No secrets, credentials, personal data, or production connections.
- Generated catalog photography is committed as a project asset.
- Prototype orders remain in the visitor's browser only.
