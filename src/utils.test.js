import { imgSrc } from "./utils";

// imgSrc() decides, per image host, how to serve a display-sized image:
//   - hot-link-protected dealers → our /api/img referer-rewriting proxy
//   - Phillips / Monaco → their own CDN's native resize (URL rewrite)
//   - our own storage (Vercel Blob / Supabase) → untouched
//   - everything else (full-res dealer/auction CDNs) → wsrv.nl resize proxy
// The wsrv route is the page-weight fix (e.g. Loupe This 5MB → ~40KB webp).
describe("imgSrc", () => {
  test("routes a full-res dealer/auction image through the wsrv.nl resize proxy", () => {
    const loupe =
      "https://loupethis-production.sfo2.cdn.digitaloceanspaces.com/abc123";
    const out = imgSrc(loupe);
    expect(out).toContain("images.weserv.nl");
    expect(out).toContain("output=webp");
    // wsrv takes the origin without protocol; https → `ssl:` prefix.
    expect(out).toContain(
      encodeURIComponent(
        "ssl:loupethis-production.sfo2.cdn.digitaloceanspaces.com/abc123"
      )
    );
  });

  test("honours a custom display width", () => {
    expect(imgSrc("https://cdn.shopify.com/x.jpg", 320)).toContain("w=320");
    expect(imgSrc("https://cdn.shopify.com/x.jpg")).toContain("w=720"); // default
  });

  test("leaves Phillips on its own Cloudinary resize, not wsrv", () => {
    const out = imgSrc("https://assets.phillips.com/foo/bar.jpg");
    expect(out).toContain("assets.phillips.com/image/upload/");
    expect(out).not.toContain("weserv");
  });

  test("leaves Monaco on its own Uploadcare resize, not wsrv", () => {
    const out = imgSrc("https://cdn.monacolegendauctions.com/UUID");
    expect(out).toContain("monacolegendauctions.com");
    expect(out).toContain("/-/resize/");
    expect(out).not.toContain("weserv");
  });

  test("sends hot-link-protected hosts through /api/img, not wsrv", () => {
    const out = imgSrc("https://www.watchfid.com/x.jpg");
    expect(out).toContain("/api/img?u=");
    expect(out).not.toContain("weserv");
  });

  test("does not double-wrap an already-proxied wsrv URL", () => {
    const already =
      "https://images.weserv.nl/?url=ssl:foo.com/x.jpg&w=720&output=webp";
    expect(imgSrc(already)).toBe(already);
  });

  test("leaves our own storage (Vercel Blob, Supabase) untouched", () => {
    const blob =
      "https://ivwf094dpowddgse.public.blob.vercel-storage.com/watchlist/abc.jpg";
    expect(imgSrc(blob)).toBe(blob);
    const sb =
      "https://abrqfxqmhzycphhbzklm.supabase.co/storage/v1/object/public/watch-photos/x.jpg";
    expect(imgSrc(sb)).toBe(sb);
  });

  test("leaves relative, data, and empty URLs untouched", () => {
    expect(imgSrc("/favicon-192.png")).toBe("/favicon-192.png");
    expect(imgSrc("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    expect(imgSrc("")).toBe("");
    expect(imgSrc(null)).toBe(null);
  });

  test("serves Tropical Watch (small-source CloudFront) direct, not via wsrv", () => {
    const tw = "https://d29ueykkv8fpnq.cloudfront.net/22p7a0m1wai60m6l1j78c284xuwq";
    expect(imgSrc(tw)).toBe(tw);
  });

  test("serves Bonhams (Cloudflare-blocked) direct, not via wsrv", () => {
    const b = "https://images1.bonhams.com/image?src=Image123";
    expect(imgSrc(b)).toBe(b);
  });
});
