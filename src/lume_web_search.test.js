/**
 * Guards Lumé's web-search wiring WITHOUT loading the Anthropic SDK — the tool
 * def + citation harvester live in api/lume_reference.js (the pure half) for
 * exactly this reason. Also asserts the system prompt teaches corpus-first use.
 */
import fs from "fs";
import path from "path";
import { WEB_SEARCH_TOOL, collectWebCitations, collectWebSearchQueries } from "../api/lume_reference.js";

test("WEB_SEARCH_TOOL is the native server tool with a bounded max_uses", () => {
  expect(WEB_SEARCH_TOOL.type).toBe("web_search_20250305");
  expect(WEB_SEARCH_TOOL.name).toBe("web_search");
  expect(WEB_SEARCH_TOOL.max_uses).toBeGreaterThan(0);
});

test("collectWebCitations dedupes by url and pulls title", () => {
  const sink = [];
  const content = [
    { type: "text", text: "a", citations: [
      { type: "web_search_result_location", url: "https://x.com/1", title: "One" },
      { type: "web_search_result_location", url: "https://x.com/1", title: "One dup" },
    ] },
    { type: "text", text: "b", citations: [
      { type: "web_search_result_location", url: "https://x.com/2" }, // no title → url
    ] },
    { type: "text", text: "no citations here" },
  ];
  collectWebCitations(content, sink);
  expect(sink).toEqual([
    { url: "https://x.com/1", title: "One" },
    { url: "https://x.com/2", title: "https://x.com/2" },
  ]);
});

test("collectWebCitations is a no-op on empty / malformed content", () => {
  const sink = [];
  collectWebCitations(undefined, sink);
  collectWebCitations([{ type: "tool_use" }, { type: "text" }], sink);
  expect(sink).toEqual([]);
});

test("collectWebSearchQueries pulls deduped web_search queries", () => {
  const sink = [];
  const content = [
    { type: "server_tool_use", name: "web_search", input: { query: "tudor snowflake 9411 date" } },
    { type: "server_tool_use", name: "web_search", input: { query: "tudor snowflake 9411 date" } }, // dup
    { type: "server_tool_use", name: "web_search", input: { query: "JLC E2643 shark" } },
    { type: "server_tool_use", name: "other_tool", input: { query: "ignored" } }, // not web_search
    { type: "text", text: "not a tool use" },
  ];
  collectWebSearchQueries(content, sink);
  expect(sink).toEqual(["tudor snowflake 9411 date", "JLC E2643 shark"]);
});

test("collectWebSearchQueries is a no-op on empty / malformed content", () => {
  const sink = [];
  collectWebSearchQueries(undefined, sink);
  collectWebSearchQueries([{ type: "server_tool_use", name: "web_search" }], sink); // no input
  expect(sink).toEqual([]);
});

test("system prompt teaches corpus-FIRST web search + citation", () => {
  const txt = fs.readFileSync(
    path.join(process.cwd(), "public", "lume_system_prompt.txt"), "utf8"
  );
  expect(txt).toMatch(/web_search/);
  expect(txt.toLowerCase()).toMatch(/corpus first|corpus-first|last resort/);
});
