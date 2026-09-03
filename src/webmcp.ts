import { executeMarketplaceTool } from "./marketplace";
import type { ToolDefinition } from "./types";

const id = { type: "string", minLength: 1 };
const time = { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", description: "Local 24-hour time, for example 16:00." };

export const webMcpTools: ToolDefinition[] = [
  {
    name: "search_local_stores",
    title: "Search local stores",
    description: "Search and rank nearby custom cake stores against a user's distance, budget, product, and pickup requirements. Returns exact matches, transparent near matches, and a reasoned best match.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["cakes"], default: "cakes" },
        maxDistanceKm: { type: "number", minimum: 0.1, maximum: 50 },
        maxBudgetKrw: { type: "integer", minimum: 10000 },
        pickupDate: { type: "string", description: "Pickup date in YYYY-MM-DD format." },
        pickupTime: time,
        servings: { type: "integer", minimum: 1, maximum: 50 },
        flavor: { type: "string", maxLength: 60 },
        filling: { type: "string", maxLength: 60 },
        ingredient: { type: "string", maxLength: 60 },
        creamColor: { type: "string", maxLength: 40 },
        letteringRequired: { type: "boolean" },
      },
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("search_local_stores", input),
  },
  {
    name: "get_store_details",
    title: "Get store details",
    description: "Retrieve complete store capabilities and select that store in the visible marketplace so the human and agent share the same active context.",
    inputSchema: { type: "object", properties: { storeId: id }, required: ["storeId"] },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("get_store_details", input),
  },
  {
    name: "search_products",
    title: "Search products",
    description: "Search products across local stores by natural product, flavor, filling, or store terms, optionally within one store.",
    inputSchema: { type: "object", properties: { query: { type: "string", maxLength: 120 }, storeId: id } },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("search_products", input),
  },
  {
    name: "get_product_options",
    title: "Get product options",
    description: "Retrieve valid sizes, servings, flavors, fillings, colors, styles, lettering support, extras, and prices for one product before configuration.",
    inputSchema: { type: "object", properties: { storeId: id, productId: id }, required: ["storeId"] },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("get_product_options", input),
  },
  {
    name: "check_availability",
    title: "Check pickup availability",
    description: "Check a store's exact pickup date and time availability and return nearby alternative slots when the requested time is unavailable.",
    inputSchema: {
      type: "object",
      properties: { storeId: id, productId: id, pickupDate: { type: "string" }, pickupTime: time },
      required: ["storeId", "pickupDate", "pickupTime"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("check_availability", input),
  },
  {
    name: "configure_product",
    title: "Configure product",
    description: "Create or partially update the selected product configuration. Unspecified options are preserved, and successful changes immediately update the visible product preview.",
    inputSchema: {
      type: "object",
      properties: {
        storeId: id,
        productId: id,
        size: { type: "string" },
        servings: { type: "integer" },
        flavor: { type: "string" },
        filling: { type: "string" },
        creamColor: { type: "string" },
        designStyle: { type: "string" },
        lettering: { type: "string", maxLength: 40 },
        pickupDate: { type: "string" },
        pickupTime: time,
        extras: { type: "array", items: { type: "string" }, uniqueItems: true },
      },
      required: ["storeId"],
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("configure_product", input),
  },
  {
    name: "get_quote",
    title: "Get quote",
    description: "Calculate an itemized KRW quote from the current live configuration, including size, filling, lettering, and optional extras.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("get_quote", input),
  },
  {
    name: "prepare_order",
    title: "Prepare order",
    description: "Prepare a final order summary and confirmation token without placing the order. Use this immediately before asking the user for explicit confirmation.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("prepare_order", input),
  },
  {
    name: "place_order",
    title: "Place order",
    description: "Place and persist the prepared order only after the user explicitly confirms the exact summary, pickup time, and total. Requires the current confirmation token and confirmed=true.",
    inputSchema: {
      type: "object",
      properties: { confirmationToken: id, confirmed: { type: "boolean", const: true } },
      required: ["confirmationToken", "confirmed"],
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("place_order", input),
  },
  {
    name: "get_order_status",
    title: "Get order status",
    description: "Retrieve the current status and pickup details for an order by its returned order identifier.",
    inputSchema: { type: "object", properties: { orderId: id }, required: ["orderId"] },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: (input) => executeMarketplaceTool("get_order_status", input),
  },
];

interface BrowserModelContext {
  registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => Promise<void>;
  getTools?: () => Promise<Array<{ name: string }>>;
  executeTool?: (tool: { name: string }, input: string) => Promise<string | null>;
}

declare global {
  interface Document {
    modelContext?: BrowserModelContext;
  }
}

let registrationController: AbortController | null = null;

export async function registerWebMcpTools() {
  if (!document.modelContext?.registerTool) return { supported: false, registered: 0 };
  registrationController?.abort();
  registrationController = new AbortController();
  let registered = 0;
  for (const tool of webMcpTools) {
    await document.modelContext.registerTool(tool, { signal: registrationController.signal });
    registered += 1;
  }
  return { supported: true, registered };
}

export async function invokeTool(toolName: string, input: Record<string, unknown>) {
  if (document.modelContext?.getTools && document.modelContext.executeTool) {
    try {
      const tools = await document.modelContext.getTools();
      const tool = tools.find((item) => item.name === toolName);
      if (tool) {
        const raw = await document.modelContext.executeTool(tool, JSON.stringify(input));
        if (raw === null) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
    } catch {
      // The local registry keeps the shopping flow inspectable in browsers without WebMCP enabled.
    }
  }
  return executeMarketplaceTool(toolName, input);
}
