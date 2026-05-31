/** @jest-environment node */
/**
 * Lumé eval harness — an automated feedback loop for the concierge's behaviour.
 *
 * Drives the REAL system prompt + tool defs + tool handlers + model routing
 * (imported from api/chat.js __evalInternals, so there's no drifting copy) over
 * a battery of prompts that mirror real failures Mark hit, and asserts on the
 * outcome: did it reach the article corpus, lead with knowledge not listings,
 * keep attribute words OUT of the search query, produce a real answer (no "I hit
 * my limit"), avoid plumbing-talk, and not call a user's real listing mislabeled.
 *
 * Skipped by default (needs ANTHROPIC_API_KEY + costs money). Runs only when
 * LUME_EVAL=1 — via the tag-... no, via .github/workflows/lume-eval.yml, which
 * sets the key + flag in CI. Use it as a regression gate before/after prompt edits.
 */
const RUN = process.env.LUME_EVAL === "1";
const suite = RUN ? describe : describe.skip;
const TIMEOUT = 120000;

// Lazy — only loaded when the eval actually runs (LUME_EVAL=1). Keeping these
// out of the top-level means a normal (skipped) CI run never imports the
// Anthropic/Supabase SDKs or chat.js, so it can't turn the test suite red.
let Anthropic, E, getReference, searchArticles;
async function load() {
  if (E) return;
  // CRA's jest (node env, jest 27) doesn't expose a global fetch, nor the web
  // globals undici depends on (ReadableStream, MessageChannel, Blob…). Seed them
  // from Node's built-in modules, THEN load undici, THEN set fetch — so the
  // Anthropic SDK has a working fetch stack.
  if (typeof globalThis.fetch !== "function") {
    const web = await import("node:stream/web");
    const wt = await import("node:worker_threads");
    const buf = await import("node:buffer");
    const g = globalThis;
    g.ReadableStream ??= web.ReadableStream;
    g.WritableStream ??= web.WritableStream;
    g.TransformStream ??= web.TransformStream;
    g.MessageChannel ??= wt.MessageChannel;
    g.MessagePort ??= wt.MessagePort;
    g.Blob ??= buf.Blob;
    g.structuredClone ??= (v) => JSON.parse(JSON.stringify(v));
    const u = await import("undici");
    g.fetch = u.fetch;
    g.Headers = u.Headers;
    g.Request = u.Request;
    g.Response = u.Response;
    g.FormData ??= u.FormData;
  }
  Anthropic = (await import("@anthropic-ai/sdk")).default;
  ({ __evalInternals: E } = await import("../api/chat.js"));
  ({ getReference, searchArticles } = await import("../api/lume_reference.js"));
}

async function runTool(name, input, ctx) {
  if (name === "get_user_context") return ctx;                       // stubbed (no Supabase in the harness)
  if (name === "search_listings") return E.toolSearchListings(input || {});
  if (name === "get_auction_state") return E.toolGetAuctionState(input || {});
  if (name === "get_reference") return getReference(input || {});
  if (name === "search_articles") return searchArticles(input || {});
  return { error: `unknown tool: ${name}` };
}

// Mirror of the api/chat.js tool-use loop, using the exported internals so the
// eval tests exactly what ships. Returns the final text, the tool calls made,
// and the parsed <actions>.
async function runTurn(userText, ctx = { hearted_count: 0, saved_search_count: 0 }) {
  await load();
  const client = new Anthropic();
  const system = [{ type: "text", text: E.SYSTEM_PROMPT }];
  const tools = E.TOOLS;
  const convo = [{ role: "user", content: userText }];
  const toolCalls = [];
  let raw = "";
  const model = E.chooseModel(userText);
  for (let round = 0; round < E.MAX_TOOL_ROUNDS; round++) {
    const params = { model, max_tokens: 1024, system, tools, messages: convo };
    if (model === E.MODEL_SMART) params.thinking = { type: "disabled" };
    const resp = await client.messages.create(params);
    if (resp.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: resp.content });
      const results = [];
      for (const b of resp.content) {
        if (b.type !== "tool_use") continue;
        toolCalls.push({ name: b.name, input: b.input || {} });
        const r = await runTool(b.name, b.input, ctx);
        results.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(r).slice(0, 60000) });
      }
      convo.push({ role: "user", content: results });
      continue;
    }
    raw = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    break;
  }
  if (!raw) {
    // Mirror chat.js: loop exhausted on tool calls → force one no-tools answer.
    const fp = { model, max_tokens: 1024, system, messages: convo };
    if (model === E.MODEL_SMART) fp.thinking = { type: "disabled" };
    const fr = await client.messages.create(fp);
    raw = fr.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  }
  const { text, actions } = E.extractActions(raw);
  return { finalText: text, rawText: raw, toolCalls, actions };
}

// Attribute words the search CAN'T filter — must never appear in a query.
const ATTR = /\b(stainless|steel|silver|champagne|quick.?set|no.?date|dial|baton|numeral|36\s?mm|gilt|tropical)\b/i;
// Internal-plumbing talk Lumé must never leak.
const PLUMBING = /not (yet )?(in|within) (our|the)[^.]{0,25}(index|corpus|coverage)|trigger(ing)? indexing|saved enough|been saved (by )?(enough )?users|hasn'?t been saved|haven'?t been saved/i;
const FALLBACK = /hit my limit working that one out/i;
const names = (r) => r.toolCalls.map((t) => t.name);

suite("Lumé eval — live behaviour (LUME_EVAL=1)", () => {
  test("Enicar: reaches the article corpus, no plumbing-talk", async () => {
    const r = await runTurn("Tell me about the Enicar Sherpa Super Jet — does it have a date window?");
    expect(names(r)).toContain("search_articles");        // must use its corpus, not dismiss
    expect(r.finalText.length).toBeGreaterThan(0);
    expect(r.rawText).not.toMatch(PLUMBING);
  }, TIMEOUT);

  test("Quickset-Datejust advice: real answer, no attributes in the search query", async () => {
    const r = await runTurn("I want a Datejust after the 1601 so it has quickset, in stainless with a silver dial. What do you think — any advice?");
    expect(r.rawText).not.toMatch(FALLBACK);              // no loop-exhaustion dead-end
    expect(r.finalText.length).toBeGreaterThan(0);
    for (const t of r.toolCalls) if (t.name === "search_listings") expect(String(t.input.query || "")).not.toMatch(ATTR);
    for (const a of r.actions) if (a.type === "show_listings") expect(String(a.payload?.query || "")).not.toMatch(ATTR);
  }, TIMEOUT);

  test("Find stainless silver Datejust: clean (filterable) search query only", async () => {
    const r = await runTurn("find me a stainless steel silver dial Datejust");
    for (const t of r.toolCalls) if (t.name === "search_listings") expect(String(t.input.query || "")).not.toMatch(ATTR);
    for (const a of r.actions) if (a.type === "show_listings") expect(String(a.payload?.query || "")).not.toMatch(ATTR);
  }, TIMEOUT);

  test("Watch question leads with knowledge, not listings", async () => {
    const r = await runTurn("Does the Rolex GMT-Master 1675 have a date window?");
    expect(names(r).some((n) => n === "get_reference" || n === "search_articles")).toBe(true);
    expect(r.finalText.length).toBeGreaterThan(0);
  }, TIMEOUT);

  test("Out-of-scope (omelette recipe) is declined / steered back to watches", async () => {
    const r = await runTurn("Can you give me a recipe for a cheese omelette?");
    expect(r.rawText).not.toMatch(/\b(whisk|beat the eggs|frying pan|melt the butter|heat the pan|fold the omelette)\b/i);
    expect(r.rawText).toMatch(/watch/i);
  }, TIMEOUT);

  test("Doesn't call the user's real watch 'mislabeled' (Tudor 9411 date)", async () => {
    const r = await runTurn("I'm looking at a Tudor 9411/0 listing and it has a date window. Is that right?");
    expect(r.rawText).not.toMatch(/mislabel|probably (a |an )?7021|red flag|it'?s fake|not a (real |genuine )?9411/i);
  }, TIMEOUT);

  test("Basic question doesn't dead-end (Tudor snowflake — Mark's repro)", async () => {
    // Real failure: this exact ask returned "I hit my limit working that one out".
    const r = await runTurn("Thinking about a Tudor Submariner snowflake. What models does this include?");
    expect(r.rawText).not.toMatch(FALLBACK);
    expect(r.finalText.length).toBeGreaterThan(0);
  }, TIMEOUT);

  test("Taste statement engages, doesn't claim 'we have N' stock (gold)", async () => {
    // Real failure: "we have 45" (we own nothing; 775 actually showed); shopped
    // instead of engaging the taste.
    const r = await runTurn("I really like gold watches.");
    expect(r.finalText.length).toBeGreaterThan(0);
    expect(r.rawText).not.toMatch(/\bwe (have|own|stock|carry|'ve got)\b/i);  // not our stock
  }, TIMEOUT);

  test("Two references: never joins them into one zero-result query", async () => {
    // Real failure: searched "105.012 & 145.022" → literal match → 0 → "no listings".
    const r = await runTurn("Compare the Speedmaster 105.012 and the 145.022 — and can I see listings?");
    for (const t of r.toolCalls) {
      if (t.name !== "search_listings") continue;
      const q = String(t.input.query || "");
      // a single search query must not carry BOTH references at once
      expect(/105\.?012/.test(q) && /145\.?022/.test(q)).toBe(false);
    }
    for (const a of r.actions) {
      if (a.type !== "show_listings") continue;
      const q = String(a.payload?.query || "");
      expect(/105\.?012/.test(q) && /145\.?022/.test(q)).toBe(false);
    }
    expect(r.rawText).not.toMatch(FALLBACK);
  }, TIMEOUT);
});
