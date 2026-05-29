import { dispatchAction, registerActionHandlers } from "./ActionBus";

// ActionBus is module-level state; the first test runs before any handlers are
// registered (jest preserves in-file order), so it exercises the unmounted path.

describe("ActionBus", () => {
  test("dispatch with no host registered → graceful ok:false", async () => {
    const res = await dispatchAction({ type: "show_listings", payload: {} });
    expect(res.ok).toBe(false);
    expect(typeof res.message).toBe("string");
  });

  test("registered handler runs with the payload → ok:true; teardown restores fallback", async () => {
    const calls = [];
    const unregister = registerActionHandlers({
      show_listings: (p) => { calls.push(p); },
    });
    const res = await dispatchAction({ type: "show_listings", payload: { brand: "Tudor" } });
    expect(res.ok).toBe(true);
    expect(calls).toEqual([{ brand: "Tudor" }]);

    unregister();
    const after = await dispatchAction({ type: "show_listings", payload: {} });
    expect(after.ok).toBe(false);
  });

  test("unknown action type → ok:false", async () => {
    registerActionHandlers({ show_listings: () => {} });
    const res = await dispatchAction({ type: "definitely_not_a_type", payload: {} });
    expect(res.ok).toBe(false);
  });

  test("handler throw is caught and surfaced", async () => {
    registerActionHandlers({ boom: () => { throw new Error("kaboom"); } });
    const res = await dispatchAction({ type: "boom" });
    expect(res.ok).toBe(false);
    expect(res.message).toBe("kaboom");
  });

  test("handler returning {ok:false,message} is passed through", async () => {
    registerActionHandlers({ nope: () => ({ ok: false, message: "that one's gone" }) });
    const res = await dispatchAction({ type: "nope" });
    expect(res).toEqual({ ok: false, message: "that one's gone" });
  });
});
