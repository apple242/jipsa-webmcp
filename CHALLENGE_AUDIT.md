# WebMCP Challenge audit

This audit uses the four judging dimensions in the project brief and focuses on concrete evidence in the shipped repository.

## 1. WebMCP leverage — 9/10

Evidence:

- Ten small, composable tools span discovery, comparison, product inspection, availability, configuration, quote, safe preparation, order placement, and order status.
- Tools register through the current `document.modelContext.registerTool()` API.
- All tools have distinct English names, decision-oriented descriptions, JSON Schema inputs, runtime validation, structured results, and recoverable errors.
- Agent actions reuse marketplace domain functions and update the same visible state as human actions.
- Search performs non-trivial filtering, exact configured pricing, time-distance comparison, and ranking over 20 stores.
- The visible comparison ledger reports 20 makers checked, criterion-level rejection counts, and the final shortlist.
- The developer audit exposes tool arguments, results, state changes, and errors.
- A local registry fallback is clearly labeled as a rehearsal when the browser does not expose WebMCP; it does not claim a native protocol connection.

Remaining ceiling:

- Native discovery must be tested again on the final HTTPS deployment in ChatGPT's in-app browser or an origin-trial Chrome build. The live deployment includes the required WebMCP security headers.

## 2. Execution — 9/10

Evidence:

- The complete search → compare → select → configure → correct → quote → confirm → order flow works from a clean state.
- Twenty varied cake stores have different prices, distances, capabilities, and pickup slots.
- Search and final quote use the same pricing engine and both produce the expected ₩44,000 total.
- Partial configuration changes preserve unspecified state.
- Demo orders are persisted in localStorage and can be read from the visible order ledger or `get_order_status`.
- Six automated tests cover comparison evidence, shared pricing, ranking, state preservation, invalid inputs, confirmation gating, persistence, and native tool registration.
- The production bundle builds successfully and was smoke-tested in a clean browser tab with no console errors.
- Desktop and 390 px mobile layouts were visually inspected.

Remaining ceiling:

- Native WebMCP discovery should be verified against the final production URL before submission.

## 3. Potential impact — 9/10

Evidence:

- The compound shopping request replaces repeated manual visits to store detail, pricing, customization, and calendar pages.
- Exact matches and near-time alternatives are separated instead of hiding tradeoffs.
- The search result explains why the best match was selected.
- `prepare_order` and `place_order` are deliberately separate. No order can be created without a matching short-lived token and explicit confirmation.
- The product focuses on a complete custom-cake vertical instead of claiming depth through unfinished categories.

## 4. Creativity and ambition — 9/10

Evidence:

- Jipsa is designed as a consumer marketplace first, with ChatGPT ordering built into the same commerce flow.
- The human remains in a polished consumer workflow while the agent uses structured capabilities.
- Generated product photography changes with cream-color configuration, making agent state changes immediately legible.
- Shop with ChatGPT is a transparent tool rehearsal and shopping assistant, not a hard-coded chat answer.
- The confirmation boundary demonstrates a collaborative human + agent ordering pattern that can extend across local custom commerce.

## Final risk review

Public access and the required deployment headers are verified. Run one native WebMCP discovery pass and capture a sub-three-minute screen recording before submission.
