# Testing Jipsa

## Fast judge path

1. Open https://jipsa.dev557938.chatgpt.site in ChatGPT's in-app browser.
2. Confirm the storefront loads without authentication.
3. Ask the browser agent:

   > Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup on September 5, 2026 at 4 PM.

4. Confirm that `search_local_stores` is called and returns:

   - 20 makers checked
   - 3 shortlisted
   - Mellow Cake as the exact 4:00 PM best match
   - Mellow Cake at ₩44,000
   - Dear Cake at ₩46,000 for 4:30 PM
   - Cake Forest at ₩49,000 for 5:00 PM

   Rejection counts overlap because a maker can fail more than one criterion.

5. Continue:

   > Use the best one. Make the cream lavender and write “Happy Birthday Mina”.

6. Confirm the agent calls store/option/configuration tools and the visible configurator opens with the requested values.
7. Continue:

   > Actually, make the cream light pink.

8. Confirm only the cream color changes and the cake preview updates.
9. Ask for the final quote and order preparation. Confirm the itemized total is ₩44,000 and a human review dialog opens.
10. Place the prototype order only after explicit confirmation, then use `get_order_status` with the returned order ID.

## WebMCP surface

The page should expose these ten tools:

1. `search_local_stores`
2. `get_store_details`
3. `search_products`
4. `get_product_options`
5. `check_availability`
6. `configure_product`
7. `get_quote`
8. `prepare_order`
9. `place_order`
10. `get_order_status`

All tools are registered in `src/webmcp.ts` through the imperative `document.modelContext.registerTool()` API.

## Browser requirements

- ChatGPT's in-app browser supports WebMCP directly.
- In Google Chrome, enable `chrome://flags/#enable-webmcp-testing` and relaunch the browser.
- The live site sends `Origin-Agent-Cluster: ?1` and `Permissions-Policy: tools=(self)`.

## Local verification

```bash
npm install
npm test
npm run build
```

The deterministic tests cover 20-maker filtering, partial configuration updates, validation errors, quote consistency, confirmation gating, local order persistence, and the complete 10-tool WebMCP contract.

## Prototype scope

Catalog, availability, and order data are synthetic. Orders persist only in the current browser's local storage. No real payment is charged and no personal information is required.
