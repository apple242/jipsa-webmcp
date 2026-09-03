/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from "vitest";
import { executeMarketplaceTool, marketplaceStore, searchStores } from "./marketplace";
import { registerWebMcpTools, webMcpTools } from "./webmcp";

describe("Nearmade marketplace tools", () => {
  beforeEach(() => {
    localStorage.clear();
    marketplaceStore.reset();
  });

  it("ranks the exact store ahead of transparent near-time matches", () => {
    const results = searchStores({
      maxDistanceKm: 3,
      maxBudgetKrw: 50000,
      pickupTime: "16:00",
      servings: 4,
      ingredient: "Strawberry",
      creamColor: "White",
      letteringRequired: true,
    });

    expect(results[0]).toMatchObject({
      storeId: "mellow-cake",
      estimatedPriceKrw: 44000,
      exactPickupTime: true,
      satisfiesAllProductRequirements: true,
    });
    expect(results[1]).toMatchObject({ storeId: "dear-cake", exactPickupTime: false, closestPickupTime: "16:30" });
    expect(results[2]).toMatchObject({ storeId: "cake-forest", exactPickupTime: false, closestPickupTime: "17:00" });
  });

  it("preserves all unspecified configuration fields during a human correction", async () => {
    await executeMarketplaceTool("get_store_details", { storeId: "mellow-cake" });
    await executeMarketplaceTool("configure_product", {
      storeId: "mellow-cake",
      creamColor: "Lavender",
      lettering: "Happy Birthday Mina",
      pickupTime: "16:00",
    });
    const before = marketplaceStore.getState().configuration;
    await executeMarketplaceTool("configure_product", { storeId: "mellow-cake", creamColor: "Light pink" });
    const after = marketplaceStore.getState().configuration;

    expect(after?.creamColor).toBe("Light pink");
    expect(after?.lettering).toBe("Happy Birthday Mina");
    expect(after?.pickupTime).toBe("16:00");
    expect(after?.filling).toBe(before?.filling);
  });

  it("rejects unavailable options with a recoverable error", async () => {
    await executeMarketplaceTool("get_store_details", { storeId: "mellow-cake" });
    const result = await executeMarketplaceTool("configure_product", { storeId: "mellow-cake", creamColor: "Neon green" }) as {
      ok: boolean;
      error: { code: string; nextAction: string };
    };

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("OPTION_UNAVAILABLE");
    expect(result.error.nextAction).toContain("White");
  });

  it("requires a prepared token and explicit confirmation before creating an order", async () => {
    await executeMarketplaceTool("get_store_details", { storeId: "mellow-cake" });
    await executeMarketplaceTool("configure_product", {
      storeId: "mellow-cake",
      creamColor: "Light pink",
      lettering: "Happy Birthday Mina",
      pickupTime: "16:00",
    });
    await executeMarketplaceTool("get_quote", {});
    const prepared = await executeMarketplaceTool("prepare_order", {}) as {
      preparedOrder: { confirmationToken: string };
    };

    const rejected = await executeMarketplaceTool("place_order", {
      confirmationToken: prepared.preparedOrder.confirmationToken,
      confirmed: false,
    }) as { ok: boolean; error: { code: string } };
    expect(rejected.error.code).toBe("CONFIRMATION_REQUIRED");
    expect(marketplaceStore.getState().orders).toHaveLength(0);

    const placed = await executeMarketplaceTool("place_order", {
      confirmationToken: prepared.preparedOrder.confirmationToken,
      confirmed: true,
    }) as { ok: boolean; order: { id: string; status: string } };
    expect(placed.ok).toBe(true);
    expect(placed.order.status).toBe("confirmed");
    expect(marketplaceStore.getState().orders).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem("nearmade-demo-orders") || "[]")).toHaveLength(1);
  });

  it("registers ten distinct, schema-backed tools with document.modelContext", async () => {
    const registered: string[] = [];
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: {
        registerTool: async (tool: { name: string; description: string; inputSchema: unknown }) => {
          expect(tool.description.length).toBeGreaterThan(20);
          expect(tool.inputSchema).toBeTruthy();
          registered.push(tool.name);
        },
      },
    });

    const result = await registerWebMcpTools();
    expect(result).toEqual({ supported: true, registered: 10 });
    expect(new Set(registered).size).toBe(10);
    expect(registered).toEqual(webMcpTools.map((tool) => tool.name));
  });
});
