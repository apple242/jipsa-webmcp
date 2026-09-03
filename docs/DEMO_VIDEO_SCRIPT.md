# Jipsa Demo Video Script

Target length: 2 minutes 15 seconds. Keep the final public YouTube upload under 3 minutes and include clear voice-over audio.

## 0:00–0:15 — The problem

Show the Jipsa homepage and a few maker cards.

Voice-over:

> Custom cake shopping means comparing prices, options, and pickup calendars across many local makers. Jipsa is a real storefront for people, with structured WebMCP capabilities for their agents.

## 0:15–0:40 — One compound search

In ChatGPT's in-app browser, ask:

> Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup on September 5, 2026 at 4 PM.

Show the visible search state and comparison ledger.

Voice-over:

> The agent calls `search_local_stores`. Jipsa checks all 20 makers against distance, exact configured price, product requirements, and pickup inventory. The UI shows the three candidates and why the others were filtered out.

## 0:40–1:00 — Explain the recommendation

Show Mellow Cake, Dear Cake, and Cake Forest.

Voice-over:

> Mellow Cake is the best match at forty-four thousand won with the exact 4 PM slot. Dear Cake and Cake Forest satisfy the product requirements but offer nearby times. Search and checkout use one pricing engine.

## 1:00–1:30 — Shared human-agent state

Ask:

> Use the best one. Make the cream lavender and write “Happy Birthday Mina”.

Show the configurator and preview update. Then ask:

> Actually, make the cream light pink.

Voice-over:

> The agent composes store, option, and configuration tools. Its choices update the same visible state the shopper uses. A follow-up changes only the requested field while the rest of the order stays intact.

## 1:30–1:55 — Quote and safety

Ask for the quote and order preparation. Show the ₩44,000 itemized total and the final review dialog.

Voice-over:

> `get_quote` calculates the option-level total. `prepare_order` does not place anything; it creates a short-lived token and opens human review. `place_order` works only after explicit confirmation of this exact summary.

## 1:55–2:15 — Prove WebMCP depth

Briefly open Developer Audit and show several tool calls, then return to the completed storefront state.

Voice-over:

> Jipsa exposes ten focused WebMCP tools across search, availability, configuration, quoting, confirmation, ordering, and status. One website gives people a visual marketplace and agents reliable capabilities—without splitting the experience in two.

End card:

> Jipsa — local commerce for people and their agents.
