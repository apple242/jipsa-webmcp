import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Code2,
  Gift,
  Heart,
  LocateFixed,
  MapPin,
  Menu,
  PackageCheck,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store as StoreIcon,
  TerminalSquare,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { cakeStores, categories, getStore, imageIndexForColor, imagePosition } from "./data";
import { configureForHuman, formatTime, marketplaceStore, selectStoreForHuman } from "./marketplace";
import type { MarketplaceState, SearchCandidate, Store } from "./types";
import { invokeTool, registerWebMcpTools, webMcpTools } from "./webmcp";

type AgentMessage = {
  role: "user" | "agent" | "tool";
  text: string;
  tool?: string;
};

const DEMO_PROMPT = "Find a custom cake within 3 km, under ₩50,000, for four people, with strawberry, white cream, custom lettering, and pickup this Saturday at 4 PM.";

function formatKrw(value: number) {
  return `₩${value.toLocaleString("en-US")}`;
}

function todayToNextSaturday() {
  const date = new Date();
  const days = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function CakeImage({ index, className = "", label }: { index: number; className?: string; label: string }) {
  return (
    <div
      className={`cake-image ${className}`}
      role="img"
      aria-label={label}
      style={{ backgroundPosition: imagePosition(index) }}
    />
  );
}

function useMarketplace() {
  return useSyncExternalStore(marketplaceStore.subscribe, marketplaceStore.getState, marketplaceStore.getState);
}

function Logo() {
  return (
    <a href="#top" className="logo" aria-label="Nearmade home">
      <span className="logo-mark"><span /></span>
      <span>nearmade</span>
    </a>
  );
}

function Header({ onOpenAgent, onOpenOrders }: { onOpenAgent: () => void; onOpenOrders: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Logo />
        <button className="location-button" type="button">
          <MapPin size={16} strokeWidth={2} />
          <span>Seongsu, Seoul</span>
          <ChevronDown size={14} />
        </button>
        <nav className={mobileOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          <a href="#marketplace">Discover</a>
          <a href="#how-it-works">How it works</a>
          <a href="#categories">For makers</a>
        </nav>
        <div className="header-actions">
          <button className="icon-button order-button" type="button" onClick={onOpenOrders} title="View demo orders">
            <ShoppingBag size={19} />
          </button>
          <button className="agent-button" type="button" onClick={onOpenAgent}>
            <Bot size={17} />
            Agent Studio
          </button>
          <button className="icon-button mobile-menu" type="button" onClick={() => setMobileOpen((value) => !value)} title="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onOpenAgent }: { onOpenAgent: () => void }) {
  return (
    <section className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow"><LocateFixed size={14} /> Made nearby, for you</p>
        <h1>Local things,<br /><em>made exactly right.</em></h1>
        <p className="hero-intro">Discover independent makers for one-of-a-kind cakes, flowers, gifts, and desserts—then make every detail yours.</p>
        <div className="hero-actions">
          <a className="primary-link" href="#marketplace">Explore nearby makers <ArrowRight size={17} /></a>
          <button className="text-button" type="button" onClick={onOpenAgent}><Sparkles size={16} /> Ask your agent</button>
        </div>
      </div>
      <div className="hero-visual" aria-label="Featured custom cakes">
        <CakeImage index={0} label="White strawberry cake from Mellow Cake" className="hero-main-image" />
        <div className="maker-note">
          <span className="avatar">MC</span>
          <span><strong>Mellow Cake</strong><small>1.2 km away · Pickup today</small></span>
          <Heart size={17} />
        </div>
        <div className="hero-thumbnail"><CakeImage index={1} label="Lavender vintage heart cake" /></div>
      </div>
    </section>
  );
}

function CategoryTabs({ active, onChange }: { active: string; onChange: (id: MarketplaceState["category"]) => void }) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Marketplace categories">
      {categories.map((category) => (
        <button
          type="button"
          role="tab"
          aria-selected={active === category.id}
          className={active === category.id ? "category-tab active" : "category-tab"}
          key={category.id}
          onClick={() => onChange(category.id)}
        >
          {category.label}<span>{category.count}</span>
        </button>
      ))}
    </div>
  );
}

function SearchBar({ onAgentSearch }: { onAgentSearch: () => void }) {
  return (
    <div className="market-search">
      <Search size={18} />
      <input aria-label="Search local makers" placeholder="Search cakes, flavors, or makers" />
      <span className="search-divider" />
      <button type="button" onClick={onAgentSearch}><SlidersHorizontal size={16} /> Find an exact match</button>
    </div>
  );
}

function StoreCard({ store, rank, candidate }: { store: Store; rank?: number; candidate?: SearchCandidate }) {
  return (
    <article className={rank === 1 ? "store-card best-card" : "store-card"}>
      <button className="card-image-button" type="button" onClick={() => selectStoreForHuman(store.id)} aria-label={`View ${store.name}`}>
        <CakeImage index={store.imageIndex} label={store.product.name} />
        <span className="favorite"><Heart size={17} /></span>
        {rank === 1 && <span className="best-label"><Sparkles size={13} /> Best Match</span>}
        {store.sameDay && !rank && <span className="availability-label">Same-day</span>}
      </button>
      <div className="card-body">
        <div className="card-title-row">
          <div>
            <h3>{store.name}</h3>
            <p>{store.description}</p>
          </div>
          <span className="rating"><Star size={13} fill="currentColor" /> {store.rating}</span>
        </div>
        {candidate && (
          <div className="match-reason">
            <CircleCheck size={15} />
            <span>{candidate.exactPickupTime ? `Exact ${formatTime(candidate.closestPickupTime)} pickup` : `Closest pickup ${formatTime(candidate.closestPickupTime)}`}</span>
          </div>
        )}
        <div className="card-meta">
          <span><MapPin size={14} /> {store.distanceKm} km</span>
          <span>From {formatKrw(store.priceRange[0])}</span>
        </div>
      </div>
    </article>
  );
}

function NonCakeCategory({ category }: { category: MarketplaceState["category"] }) {
  const item = categories.find((entry) => entry.id === category)!;
  return (
    <div className={`category-preview category-${category}`}>
      <div className="category-preview-copy">
        <p className="eyebrow"><Sparkles size={14} /> Same marketplace architecture</p>
        <h3>{item.label}, shaped around your request.</h3>
        <p>{item.description}. Nearmade maps every maker's real capabilities to a reusable category schema, ready for both people and agents.</p>
        <div className="sample-makers">
          {item.sampleShops.slice(0, 5).map((shop) => <span key={shop}>{shop}</span>)}
        </div>
        <button type="button" onClick={() => marketplaceStore.update({ category: "cakes" })}>Explore the complete cake demo <ArrowRight size={16} /></button>
      </div>
      <div className="category-art" aria-hidden="true">
        <span className="shape-one" />
        <span className="shape-two" />
        <span className="shape-three" />
        <Gift size={56} />
      </div>
    </div>
  );
}

function Marketplace({ state, onOpenAgent }: { state: MarketplaceState; onOpenAgent: () => void }) {
  const featured = cakeStores.slice(0, 8);
  const searchStores = state.searchResults
    .map((result) => ({ store: getStore(result.storeId), result }))
    .filter((item): item is { store: Store; result: SearchCandidate } => Boolean(item.store));
  const showingSearch = state.category === "cakes" && searchStores.length > 0;

  return (
    <section className="marketplace-section" id="marketplace">
      <div className="shell">
        <div className="marketplace-heading">
          <div>
            <p className="section-kicker">Near you now</p>
            <h2>{showingSearch ? "Matches for your request" : "Find your local favorite"}</h2>
          </div>
          {showingSearch && <button className="reset-search" type="button" onClick={() => marketplaceStore.update({ searchResults: [], searchArgs: null })}><RotateCcw size={15} /> Clear agent results</button>}
        </div>
        <SearchBar onAgentSearch={onOpenAgent} />
        <CategoryTabs active={state.category} onChange={(category) => marketplaceStore.update({ category, searchResults: [] })} />

        {state.category !== "cakes" ? (
          <NonCakeCategory category={state.category} />
        ) : (
          <>
            {showingSearch && (
              <div className="best-match-summary">
                <div className="summary-icon"><Sparkles size={19} /></div>
                <div>
                  <span>Agent recommendation</span>
                  <strong>{state.searchResults[0].explanation}</strong>
                </div>
                <button type="button" onClick={() => selectStoreForHuman(state.searchResults[0].storeId)}>Customize <ArrowRight size={15} /></button>
              </div>
            )}
            <div className="store-grid">
              {(showingSearch ? searchStores : featured.map((store) => ({ store, result: undefined }))).map((item, index) => (
                <StoreCard key={item.store.id} store={item.store} rank={showingSearch ? index + 1 : undefined} candidate={item.result} />
              ))}
            </div>
            {!showingSearch && (
              <button className="show-more" type="button" onClick={() => marketplaceStore.update({ searchResults: cakeStores.slice(0, 12).map((store, index) => ({
                storeId: store.id, storeName: store.name, distanceKm: store.distanceKm, estimatedPriceKrw: store.product.basePrice,
                requestedPickupTime: "16:00", closestPickupTime: store.pickupSlots[0], exactPickupTime: store.pickupSlots.includes("16:00"),
                satisfiesAllProductRequirements: true, unmetRequirements: [], score: 100 - index,
                explanation: `${store.name} is available nearby.`,
              })) })}>Show more local makers <ChevronDown size={16} /></button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

function Configurator({ state, onClose }: { state: MarketplaceState; onClose: () => void }) {
  const store = state.selectedStoreId ? getStore(state.selectedStoreId) : undefined;
  const config = state.configuration;
  if (!state.configPanelOpen || !store || !config) return null;
  const previewIndex = imageIndexForColor(config.creamColor, store.imageIndex);
  const patch = (value: Record<string, unknown>) => configureForHuman({ storeId: store.id, ...value });

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close customization" />
      <aside className="config-drawer" role="dialog" aria-modal="true" aria-label={`Customize ${store.product.name}`}>
        <div className="drawer-header">
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
          <span>Customize your cake</span>
          <button className="icon-button" type="button" title="Save favorite"><Heart size={19} /></button>
        </div>
        <div className="config-layout">
          <div className="config-preview">
            <CakeImage index={previewIndex} label={`${config.creamColor} ${store.product.name}`} />
            {config.lettering && <div className="cake-lettering">{config.lettering}</div>}
            <div className="preview-change"><Sparkles size={14} /> Live preview synced with WebMCP</div>
          </div>
          <div className="config-form">
            <div className="maker-mini"><span>{store.name}</span><span><Star size={12} fill="currentColor" /> {store.rating} · {store.distanceKm} km</span></div>
            <h2>{store.product.name}</h2>
            <p>{store.description}. Every cake is finished to order in {store.neighborhood}.</p>
            <div className="form-grid">
              <SelectField label="Size" value={config.size} options={store.product.sizes} onChange={(size) => patch({ size })} />
              <SelectField label="Flavor" value={config.flavor} options={store.product.flavors} onChange={(flavor) => patch({ flavor })} />
              <SelectField label="Filling" value={config.filling} options={store.product.fillings} onChange={(filling) => patch({ filling })} />
              <SelectField label="Design" value={config.designStyle} options={store.product.designStyles} onChange={(designStyle) => patch({ designStyle })} />
            </div>
            <fieldset className="color-options">
              <legend>Cream color <span>{config.creamColor}</span></legend>
              <div>
                {store.product.creamColors.map((color) => (
                  <button
                    className={config.creamColor === color ? "color-choice active" : "color-choice"}
                    type="button"
                    key={color}
                    onClick={() => patch({ creamColor: color })}
                    aria-label={color}
                    title={color}
                  >
                    <span style={{ background: color === "White" ? "#fffdf8" : color === "Lavender" ? "#b9a4cf" : color === "Light pink" ? "#edb7bd" : "#f1d57a" }} />
                    {config.creamColor === color && <Check size={13} />}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="lettering-field">
              <span>Lettering <small>Up to 40 characters</small></span>
              <input value={config.lettering} maxLength={40} placeholder="Happy Birthday Mina" onChange={(event) => patch({ lettering: event.target.value })} />
              <em>{config.lettering.length}/40</em>
            </label>
            <div className="pickup-row">
              <label><span>Pickup date</span><input type="date" value={config.pickupDate} onChange={(event) => patch({ pickupDate: event.target.value })} /></label>
              <label><span>Pickup time</span><select value={config.pickupTime} onChange={(event) => patch({ pickupTime: event.target.value })}>{store.pickupSlots.map((slot) => <option value={slot} key={slot}>{formatTime(slot)}</option>)}</select></label>
            </div>
            {state.quote && (
              <div className="quote-breakdown">
                <div><span>Base cake</span><span>{formatKrw(state.quote.subtotalKrw)}</span></div>
                {state.quote.adjustments.map((adjustment) => <div key={adjustment.label}><span>{adjustment.label}</span><span>+{formatKrw(adjustment.amountKrw)}</span></div>)}
                <div className="quote-total"><span>Total</span><strong>{formatKrw(state.quote.totalKrw)}</strong></div>
              </div>
            )}
            <div className="config-cta">
              <div><small>{state.quote ? "Current total" : "Starting from"}</small><strong>{formatKrw(state.quote?.totalKrw || store.product.basePrice)}</strong></div>
              <button type="button" onClick={async () => {
                if (!state.quote) await invokeTool("get_quote", {});
                else await invokeTool("prepare_order", {});
              }}>{state.quote ? "Review order" : "Calculate total"} <ArrowRight size={17} /></button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function AgentStudio({ state, open, onClose, supported, registered }: { state: MarketplaceState; open: boolean; onClose: () => void; supported: boolean; registered: number }) {
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [messages, setMessages] = useState<AgentMessage[]>([
    { role: "agent", text: "I can compare real store constraints and build the order with you. Try the prepared brief below." },
  ]);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"start" | "searched" | "configured" | "corrected" | "quoted">("start");
  const [auditOpen, setAuditOpen] = useState(false);

  const addMessage = (message: AgentMessage) => setMessages((items) => [...items, message]);
  const runSearch = async () => {
    setRunning(true);
    addMessage({ role: "user", text: prompt });
    const result = await invokeTool("search_local_stores", {
      category: "cakes",
      maxDistanceKm: 3,
      maxBudgetKrw: 50000,
      pickupDate: todayToNextSaturday(),
      pickupTime: "16:00",
      servings: 4,
      ingredient: "Strawberry",
      creamColor: "White",
      letteringRequired: true,
    }) as { bestMatch?: SearchCandidate; exactMatches?: SearchCandidate[]; nearMatches?: SearchCandidate[] };
    addMessage({ role: "tool", tool: "search_local_stores", text: `${(result.exactMatches?.length || 0) + (result.nearMatches?.length || 0)} candidates compared across distance, price, options, and pickup inventory.` });
    addMessage({ role: "agent", text: result.bestMatch?.explanation || "I could not find an exact match." });
    setStage("searched");
    setRunning(false);
  };
  const configureBest = async () => {
    setRunning(true);
    addMessage({ role: "user", text: "Use the best one. Make the cream lavender and write “Happy Birthday Mina”." });
    await invokeTool("get_store_details", { storeId: "mellow-cake" });
    await invokeTool("check_availability", { storeId: "mellow-cake", productId: "mellow-cake-signature", pickupDate: todayToNextSaturday(), pickupTime: "16:00" });
    await invokeTool("configure_product", {
      storeId: "mellow-cake", productId: "mellow-cake-signature", servings: 4, flavor: "Vanilla", filling: "Fresh strawberry",
      creamColor: "Lavender", lettering: "Happy Birthday Mina", pickupDate: todayToNextSaturday(), pickupTime: "16:00",
    });
    addMessage({ role: "tool", tool: "configure_product", text: "Mellow Cake selected. The lavender preview, lettering, and 4 PM pickup are now live on the page." });
    setStage("configured");
    setRunning(false);
  };
  const correctColor = async () => {
    setRunning(true);
    addMessage({ role: "user", text: "Actually, make the cream light pink." });
    await invokeTool("configure_product", { storeId: "mellow-cake", creamColor: "Light pink" });
    addMessage({ role: "tool", tool: "configure_product", text: "Cream changed to light pink. Every other option was preserved." });
    setStage("corrected");
    setRunning(false);
  };
  const quoteAndPrepare = async () => {
    setRunning(true);
    const quoteResult = await invokeTool("get_quote", {}) as { quote?: { totalKrw: number } };
    await invokeTool("prepare_order", {});
    addMessage({ role: "tool", tool: "get_quote → prepare_order", text: `Itemized total: ${formatKrw(quoteResult.quote?.totalKrw || 0)}. A confirmation token is ready; no order has been created.` });
    addMessage({ role: "agent", text: `Your total is ${formatKrw(quoteResult.quote?.totalKrw || 0)}. Pickup is Saturday at 4:00 PM. Please review the summary and confirm to place the order.` });
    setStage("quoted");
    setRunning(false);
  };

  if (!open) return null;
  return (
    <div className="studio-layer">
      <button className="studio-backdrop" type="button" onClick={onClose} aria-label="Close Agent Studio" />
      <aside className="agent-studio" role="dialog" aria-modal="true" aria-label="Agent Studio">
        <div className="studio-header">
          <div className="studio-title"><span><Bot size={18} /></span><div><strong>Agent Studio</strong><small>Shared marketplace state</small></div></div>
          <div className="connection-status"><span className={supported ? "status-dot live" : "status-dot"} />{supported ? `${registered} WebMCP tools live` : "Local tool rehearsal"}</div>
          <button className="icon-button" type="button" onClick={onClose} title="Close"><X size={20} /></button>
        </div>
        <div className="studio-context">
          <span>On this page</span>
          <strong>Custom Cakes near Seongsu</strong>
          <small>{cakeStores.length} stores · {webMcpTools.length} tools available</small>
        </div>
        <div className="message-list">
          {messages.map((message, index) => (
            <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
              {message.tool && <span className="tool-call"><Code2 size={12} /> {message.tool}</span>}
              <p>{message.text}</p>
            </div>
          ))}
          {state.searchResults.length > 0 && stage === "searched" && (
            <div className="agent-results">
              {state.searchResults.slice(0, 3).map((candidate, index) => (
                <div key={candidate.storeId} className={index === 0 ? "agent-result best" : "agent-result"}>
                  <span>{index + 1}</span><div><strong>{candidate.storeName}</strong><small>{candidate.distanceKm} km · {formatKrw(candidate.estimatedPriceKrw)} · {formatTime(candidate.closestPickupTime)}</small></div>{index === 0 && <em>Best</em>}
                </div>
              ))}
            </div>
          )}
          {running && <div className="thinking"><span /><span /><span /></div>}
        </div>
        <div className="studio-actions">
          {stage === "start" && <button type="button" disabled={running} onClick={runSearch}><Search size={16} /> Run structured search</button>}
          {stage === "searched" && <button type="button" disabled={running} onClick={configureBest}><Sparkles size={16} /> Use the best match</button>}
          {stage === "configured" && <button type="button" disabled={running} onClick={correctColor}><SlidersHorizontal size={16} /> Make the correction</button>}
          {stage === "corrected" && <button type="button" disabled={running} onClick={quoteAndPrepare}><ClipboardCheck size={16} /> Get quote & prepare</button>}
          {stage === "quoted" && <span className="confirmation-hint"><CircleCheck size={16} /> Continue in the confirmation dialog</span>}
        </div>
        <div className="studio-composer">
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Agent request" rows={3} />
          <button type="button" onClick={stage === "start" ? runSearch : undefined} disabled={running || stage !== "start"} title="Send request"><ArrowRight size={18} /></button>
        </div>
        <button className="audit-toggle" type="button" onClick={() => setAuditOpen((value) => !value)}><TerminalSquare size={15} /> Developer audit <span>{state.logs.length}</span><ChevronDown size={14} /></button>
        {auditOpen && <AuditLog state={state} />}
      </aside>
    </div>
  );
}

function AuditLog({ state }: { state: MarketplaceState }) {
  return (
    <div className="audit-log">
      <div className="audit-log-head"><span>Latest tool activity</span><button type="button" onClick={() => marketplaceStore.clearLogs()}>Clear</button></div>
      {state.logs.length === 0 ? <p>No tool calls yet.</p> : state.logs.slice(0, 12).map((log) => (
        <details key={log.id}>
          <summary><span className={log.error ? "log-dot error" : "log-dot"} /><code>{log.toolName}</code><time>{new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></summary>
          <pre>{JSON.stringify({ input: log.input, result: log.result, error: log.error, stateChange: log.stateChange }, null, 2)}</pre>
        </details>
      ))}
    </div>
  );
}

function ConfirmationDialog({ state }: { state: MarketplaceState }) {
  const [placing, setPlacing] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);
  if (!state.confirmationOpen && !placedId) return null;
  if (placedId) {
    return (
      <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Order confirmed">
        <div className="modal-card success-card">
          <div className="success-icon"><PackageCheck size={30} /></div>
          <p className="eyebrow">Order confirmed</p>
          <h2>Your cake is in good hands.</h2>
          <p>Mellow Cake has received demo order <strong>{placedId}</strong>. We saved it locally so the agent can check its status.</p>
          <button type="button" onClick={() => setPlacedId(null)}>Continue browsing</button>
        </div>
      </div>
    );
  }
  const prepared = state.preparedOrder;
  if (!prepared) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Confirm order">
      <div className="modal-card confirm-card">
        <div className="modal-head"><div><p className="eyebrow">Final confirmation</p><h2>Review before placing</h2></div><button className="icon-button" type="button" onClick={() => marketplaceStore.update({ confirmationOpen: false })} title="Close"><X size={20} /></button></div>
        <div className="order-summary"><CakeImage index={imageIndexForColor(state.configuration?.creamColor || "White", 0)} label="Configured cake" /><div><strong>Mellow Cake</strong><p>{prepared.summary}</p></div></div>
        <div className="confirmation-total"><span>Total</span><strong>{formatKrw(prepared.totalKrw)}</strong></div>
        <div className="confirmation-note"><CircleCheck size={17} /><p>This click is the explicit human confirmation. <code>place_order</code> cannot create an order without it.</p></div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => marketplaceStore.update({ confirmationOpen: false })}>Keep editing</button><button type="button" className="confirm-button" disabled={placing} onClick={async () => {
          setPlacing(true);
          const result = await invokeTool("place_order", { confirmationToken: prepared.confirmationToken, confirmed: true }) as { order?: { id: string } };
          setPlacing(false);
          if (result.order?.id) setPlacedId(result.order.id);
        }}>{placing ? "Placing…" : "Confirm & place order"} <ArrowRight size={17} /></button></div>
      </div>
    </div>
  );
}

function OrdersPanel({ state, open, onClose }: { state: MarketplaceState; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="drawer-layer"><button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close orders" /><aside className="orders-panel" role="dialog" aria-label="Demo orders">
      <div className="drawer-header"><button className="icon-button" type="button" onClick={onClose} title="Close"><ArrowLeft size={20} /></button><span>Demo orders</span><span /></div>
      <div className="orders-content">
        <ShoppingBag size={26} />
        <h2>Your orders</h2>
        <p>Orders placed through the human flow or WebMCP are stored in the same local ledger.</p>
        {state.orders.length === 0 ? <div className="empty-orders">No orders yet. Customize a cake or run the agent demo.</div> : state.orders.map((order) => <div className="order-row" key={order.id}><CircleCheck size={18} /><div><strong>{order.storeName}</strong><span>{order.id} · {order.status}</span></div><em>{formatKrw(order.quote.totalKrw)}</em></div>)}
      </div>
    </aside></div>
  );
}

function HumanAgentStory({ onOpenAgent }: { onOpenAgent: () => void }) {
  return (
    <section className="story-section" id="how-it-works">
      <div className="shell story-grid">
        <div className="story-copy">
          <p className="section-kicker">One website, two interfaces</p>
          <h2>Beautiful to browse.<br />Structured to act.</h2>
          <p>People explore visually. Agents compare the details hidden across dozens of local shops—without scraping pages or guessing at forms.</p>
          <button type="button" onClick={onOpenAgent}>Open Agent Studio <ArrowRight size={16} /></button>
        </div>
        <div className="story-flow">
          <div className="flow-column human-flow"><span>For people</span><div><StoreIcon size={18} /><strong>Browse makers</strong><small>Products, stories, and availability</small></div><div><SlidersHorizontal size={18} /><strong>Make it yours</strong><small>Visual choices with live feedback</small></div></div>
          <div className="flow-bridge"><span /><Bot size={22} /><span /></div>
          <div className="flow-column agent-flow"><span>For agents</span><div><Search size={18} /><strong>Compare constraints</strong><small>20 stores in one structured call</small></div><div><ClipboardCheck size={18} /><strong>Prepare safely</strong><small>Quote, token, human confirmation</small></div></div>
        </div>
      </div>
    </section>
  );
}

function BroaderCategories() {
  return (
    <section className="broader-section" id="categories">
      <div className="shell">
        <p className="section-kicker">Built to travel beyond cake</p>
        <div className="broader-heading"><h2>Every custom order has its own language.</h2><p>Nearmade turns each category into a clear schema that local makers, people, and agents can all understand.</p></div>
        <div className="broader-grid">
          {categories.map((category, index) => <button type="button" key={category.id} onClick={() => { marketplaceStore.update({ category: category.id, searchResults: [] }); document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" }); }}><span>0{index + 1}</span><strong>{category.label}</strong><p>{category.description}</p><ArrowRight size={17} /></button>)}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer><div className="shell footer-inner"><Logo /><p>The local web should work for both humans and agents.</p><div><a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer">WebMCP</a><a href="#top">Back to top</a></div></div></footer>
  );
}

export default function App() {
  const state = useMarketplace();
  const [agentOpen, setAgentOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [webMcpStatus, setWebMcpStatus] = useState({ supported: false, registered: 0 });

  useEffect(() => {
    registerWebMcpTools().then(setWebMcpStatus).catch(() => setWebMcpStatus({ supported: false, registered: 0 }));
  }, []);

  const latestEvent = useMemo(() => state.lastEvent, [state.lastEvent]);

  return (
    <>
      <Header onOpenAgent={() => setAgentOpen(true)} onOpenOrders={() => setOrdersOpen(true)} />
      <main>
        <Hero onOpenAgent={() => setAgentOpen(true)} />
        <div className="live-state-bar"><div className="shell"><span><span className={webMcpStatus.supported ? "status-dot live" : "status-dot"} /> {webMcpStatus.supported ? "WebMCP connected" : "WebMCP-ready demo"}</span><span className="state-event"><Clock3 size={14} /> {latestEvent}</span><button type="button" onClick={() => { marketplaceStore.reset(); setAgentOpen(false); }}>Reset demo</button></div></div>
        <Marketplace state={state} onOpenAgent={() => setAgentOpen(true)} />
        <HumanAgentStory onOpenAgent={() => setAgentOpen(true)} />
        <BroaderCategories />
      </main>
      <Footer />
      <Configurator state={state} onClose={() => marketplaceStore.update({ configPanelOpen: false })} />
      <AgentStudio state={state} open={agentOpen} onClose={() => setAgentOpen(false)} supported={webMcpStatus.supported} registered={webMcpStatus.registered} />
      <ConfirmationDialog state={state} />
      <OrdersPanel state={state} open={ordersOpen} onClose={() => setOrdersOpen(false)} />
    </>
  );
}
