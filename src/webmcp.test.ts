import { describe, expect, it } from "vitest";
import { webMcpTools } from "./webmcp";

const expectedTools = [
  "search_local_stores",
  "get_store_details",
  "search_products",
  "get_product_options",
  "check_availability",
  "configure_product",
  "get_quote",
  "prepare_order",
  "place_order",
  "get_order_status",
];

describe("WebMCP tool surface", () => {
  it("publishes the complete commerce lifecycle as ten unique tools", () => {
    const names = webMcpTools.map((tool) => tool.name);

    expect(names).toEqual(expectedTools);
    expect(new Set(names).size).toBe(expectedTools.length);
  });

  it("gives every tool an agent-readable contract", () => {
    for (const tool of webMcpTools) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(24);
      expect(tool.inputSchema).toMatchObject({ type: "object" });
      expect(typeof tool.annotations.readOnlyHint).toBe("boolean");
      expect(typeof tool.annotations.untrustedContentHint).toBe("boolean");
      expect(typeof tool.execute).toBe("function");
    }
  });
});
