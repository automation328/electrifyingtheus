// Tell Bing (and other IndexNow engines) which pages exist, right after a deploy,
// instead of waiting for them to re-crawl the sitemap.
//
// Run by .github/workflows/indexnow.yml when content changes on main. Reads the
// LIVE sitemap, so it submits exactly what the deployed site serves.
//
//   node scripts/indexnow.mjs [https://electrifyingtheus.com]
//
// The key is public by design: IndexNow checks that https://<host>/<key>.txt
// returns it, which proves the submitter controls the site.

const SITE = (process.argv[2] || "https://electrifyingtheus.com").replace(/\/+$/, "");
const KEY = "8e467fac522b2f1c6e8eebd9f57c4aca";
const host = new URL(SITE).host;

const keyRes = await fetch(`${SITE}/${KEY}.txt`);
if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
  console.error(`IndexNow key file is not live at ${SITE}/${KEY}.txt — has the deploy finished?`);
  process.exit(1);
}

const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === host);
if (urls.length === 0) { console.error("No URLs found in the sitemap."); process.exit(1); }

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
});
// 200 = accepted, 202 = accepted, key validation pending. Anything else is a failure.
console.log(`IndexNow: submitted ${urls.length} URLs, HTTP ${res.status}`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
