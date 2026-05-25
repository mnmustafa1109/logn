---
title: "Instant A/B Testing at the Edge"
author: Noman Mustafa Mehar
pubDatetime: 2026-05-25T12:00:00+05:00
featured: true
draft: false
tags:
  - programming
  - backend development
  - software engineering
  - web development
  - cloudflare-workers
  - performance
description: "The full engineering journey of moving from janky client-side A/B test flag swaps to a zero-latency, local, streaming edge-evaluation system using Cloudflare Workers and PostHog."
---

# Instant A/B Testing at the Edge: How We Eliminated Flash of Unstyled Content

> The true measure of a user interface is not how much features it has, but how little it gets in the user's way. — Designing Data-Intensive Applications

When you run a website with a perfect Lighthouse score and sub-second load times, a 2–3 second delay caused by a feature flag check isn't just annoying — it's unacceptable. Here's the full story of how we went from a janky client-side flag swap that flashed content at users, all the way to a fully local, streaming, edge-evaluated A/B testing system that loads instantly.

---

## The Problem: Client-Side Flags Flash Content

We started with the most rudimentary approach: drop the PostHog tracking snippet in the `<head>`, then wait for it to load before checking feature flags and applying content changes.

```html
<script>
  !(function (t, e) {
    /* posthog snippet */
  })(document, window.posthog || []);
  posthog.init("phc_...", {
    api_host: "[https://posthog.lyoko.studio](https://posthog.lyoko.studio)",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    disable_web_experiments: false,
  });
</script>
```

The problem was immediately obvious: changes would appear after the page had already rendered. Users would be reading the hero section and then — snap — the title, description, and CTA would all change in front of them. Images swapping, text flickering. Classic flash of unstyled content (FOUC), but for A/B variants.

---

## Attempt 1: Lazy Loading + Fade-In Animation

The first fix was to hide the elements that needed to change, wait for the flags to resolve, then reveal them with a fade-in animation to make the swap feel seamless.

```css
/* hide hero elements until flags load */
#hero-title,
#hero-description,
#hero-cta-text {
  opacity: 0;
}

.fade-in {
  animation: fadeIn 0.8s ease-in-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

```javascript
posthog.onFeatureFlags(function () {
  revealHeroContent();
});

// fallback: reveal default content after 500ms if flags don't load
const fallbackTimeout = setTimeout(() => {
  revealHeroContent();
}, 500);

function revealHeroContent() {
  const heroTitle = document.getElementById("hero-title");
  const heroDescription = document.getElementById("hero-description");
  const heroCtaText = document.getElementById("hero-cta-text");

  if (heroTitle.classList.contains("fade-in")) return; // prevent double execution

  clearTimeout(fallbackTimeout);

  const flagValue = posthog.getFeatureFlag("hero-section");
  if (flagValue) {
    const payload = posthog.getFeatureFlagPayload("hero-section");
    if (payload) {
      if (payload.title) heroTitle.innerText = payload.title;
      if (payload.description) heroDescription.innerText = payload.description;
      if (payload.cta_text) heroCtaText.innerText = payload.cta_text;
    }
  }

  heroTitle.classList.add("fade-in");
  heroDescription.classList.add("fade-in");
  heroCtaText.classList.add("fade-in");
}
```

This helped with the jarring snap, but it introduced a new problem: everything else would load in ~600ms while the hero section faded in 2–3 seconds later. It felt like cheap hosting. We also had to add a 3-second timeout as a fallback for when PostHog was unresponsive — obviously not a great experience. A full-page loading banner made things even worse, making a lightweight Webflow-exported site feel like it was bootstrapping a heavy React app.

---

## Attempt 2: Server-Side Rendering with a Cloudflare Edge Worker

The real fix was to move the flag evaluation off the client entirely. We wrote a Cloudflare Pages middleware function that intercepts requests, calls PostHog's `/decide` endpoint, parses the flag payload, and rewrites the HTML before it ever reaches the browser.

```javascript
// functions/_middleware.js — first edge worker version
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname !== "/" && url.pathname !== "/index.html") return next();

  const response = await next();

  // parse distinct_id from PostHog cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const phCookieName = "ph_phc_...._posthog";
  let distinctId = "";

  try {
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [name, ...rest] = cookie.split("=");
      acc[name.trim()] = rest.join("=");
      return acc;
    }, {});
    if (cookies[phCookieName]) {
      distinctId = JSON.parse(
        decodeURIComponent(cookies[phCookieName])
      ).distinct_id;
    }
  } catch (err) {
    /* ignore */
  }

  if (!distinctId) distinctId = crypto.randomUUID();

  // call PostHog /decide on every request — this is the slow part
  let flags = {},
    payloads = {};
  try {
    const phResponse = await fetch(
      "[https://posthog.lyoko.studio/decide/?v=3](https://posthog.lyoko.studio/decide/?v=3)",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "phc_...", distinct_id: distinctId }),
      }
    );
    if (phResponse.ok) {
      const data = await phResponse.json();
      flags = data.featureFlags || {};
      payloads = data.featureFlagPayloads || {};
    }
  } catch (e) {
    console.error("PostHog fetch failed", e);
  }

  return new HTMLRewriter()
    .on("#hero-title", {
      element(el) {
        if (payloads["hero-section"]?.title)
          el.setInnerContent(payloads["hero-section"].title);
      },
    })
    .on("#hero-description", {
      element(el) {
        if (payloads["hero-section"]?.description)
          el.setInnerContent(payloads["hero-section"].description);
      },
    })
    .on("#hero-cta-text", {
      element(el) {
        if (payloads["hero-section"]?.cta_text)
          el.setInnerContent(payloads["hero-section"].cta_text);
      },
    })
    .transform(response);
}
```

No more content flash — the browser receives the correct variant on first paint. But now we had a different problem: a ~1.5 second added latency on every request while the worker waited for PostHog's `/decide` response. On a site previously delivering sub-100ms loads from the edge, this felt like a regression.

---

## Iteration: Cookies, Parallel Fetches, and Streaming HTML

We layered in several incremental improvements from here to claw back our performance targets.

### 1. Variant Caching with Cookies

We introduced three cookies to eliminate repeat PostHog calls for returning visitors:

```javascript
const DISTINCT_COOKIE = "ph_distinct_id"; // visitor identity — 1 year
const VARIANT_COOKIE = "ph_hero_variant"; // cached variant key — 7 days
const PAYLOAD_COOKIE = "ph_hero_payload"; // cached payload (base64 JSON) — 7 days
const IDENTITY_TTL = 60 * 60 * 24 * 365;
const VARIANT_TTL = 60 * 60 * 24 * 7;

// fast path — variant already in cookie, zero PostHog calls
const cachedVariant = getCookie(request, VARIANT_COOKIE);
const cachedPayload = getCookie(request, PAYLOAD_COOKIE);

if (cachedVariant && cachedPayload) {
  const pageResponse = await next();
  let payload;
  try {
    payload = JSON.parse(atob(cachedPayload));
  } catch {
    payload = DEFAULT_PAYLOAD;
  }
  const res = streamTransform(pageResponse, payload);
  res.headers.set("X-Feature-Flag-Cache", "HIT");
  return res;
}
```

Subsequent loads became instant. However, first-load latency remained the bottleneck.

### 2. Parallel Page and Flag Fetching

We ran the upstream page fetch and the PostHog call concurrently, so the total latency was:

$$
\text{latency} = \max(\text{page}, \text{posthog})
$$

rather than the sum of both:

```javascript
// page fetch and PostHog run concurrently — latency = max(page, posthog)
const [pageResponse, flagResult] = await Promise.all([
  next(),
  resolveFlag(posthog, distinctId),
]);
```

Since the pages were served from Cloudflare's edge on the same network, the page fetch was already fast — PostHog was the bottleneck, and this didn't move the needle much on its own.

### 3. Streaming HTML Rewriting

Rather than buffering the entire HTML response in memory and doing string replacement with regex, we switched to Cloudflare's native `HTMLRewriter` API, which transforms the response body as it streams to the client:

```javascript
// instead of:
//   const html = await response.text()  ← buffers entire page in memory
//   html.replace(/<regex>/, newText)     ← fragile, no real HTML parsing
//   new Response(html, ...)              ← re-allocates the whole string
//
// we do:
function buildRewriter(payload) {
  const p = { ...DEFAULT_PAYLOAD, ...payload };
  return new HTMLRewriter()
    .on("#hero-title", {
      element(el) {
        el.setInnerContent(p.title);
      },
    })
    .on("#hero-description", {
      element(el) {
        el.setInnerContent(p.description);
      },
    })
    .on("#hero-cta-text", {
      element(el) {
        el.setInnerContent(p.cta_text);
      },
    });
}

function streamTransform(pageResponse, payload, extraHeaders = {}) {
  const res = buildRewriter(payload).transform(
    new Response(pageResponse.body, pageResponse)
  );
  res.headers.set("Content-Type", "text/html; charset=utf-8");
  for (const [k, v] of Object.entries(extraHeaders)) res.headers.set(k, v);
  return res;
}
```

`HTMLRewriter` is a native C++ streaming parser built into the Workers runtime. The response body is never fully buffered — it streams chunk by chunk to the client. `setInnerContent()` auto-escapes text, so no manual HTML escaping is needed either.

---

## The Major Fix: Local Flag Evaluation via KV Cache

> There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton

All of the modifications above were incremental. The absolute breakthrough came from eliminating the PostHog network round-trip entirely.

PostHog supports **local flag evaluation** — instead of calling `/decide` per request, you download the full flag definitions once, store them, and evaluate flags locally using the same deterministic logic PostHog's servers would use. We stored those definitions in Cloudflare KV and built an optimized two-class caching system around it.

### The Reader — Used on Every Request

Reads flag definitions from KV. Never fetches from PostHog directly. Memoizes the KV read so it only happens once per request, regardless of how many times it's called.

```javascript
class CloudflareKVFlagCacheReader {
  constructor(kv, projectToken) {
    this.kv = kv;
    this.cacheKey = `posthog:flags:${projectToken}`;
    this._promise = null; // memoized — only one KV read per request
  }

  async getFlagDefinitions() {
    if (!this._promise) {
      this._promise = (async () => {
        try {
          const cached = await this.kv.get(this.cacheKey);
          this._raw = cached; // saved for the writer
          return cached === null ? undefined : JSON.parse(cached);
        } catch {
          return undefined;
        }
      })();
    }
    return this._promise;
  }

  shouldFetchFlagDefinitions() {
    return false;
  } // never fetch — read only
  async onFlagDefinitionsReceived() {
    throw new Error("read-only");
  }
  shutdown() {}
}
```

### The Writer — Used Only in Background Refreshes

Forces a fresh fetch from PostHog and writes the updated definitions to KV. Receives the raw string the reader already fetched so it can skip a redundant `kv.get()` comparison call — cutting KV reads by 50%.

```javascript
class CloudflareKVFlagCacheWriter {
  constructor(kv, projectToken, existingRaw = null) {
    this.kv = kv;
    this.cacheKey = `posthog:flags:${projectToken}`;
    this.existingRaw = existingRaw;
  }

  async getFlagDefinitions() {
    return undefined;
  } // always force a fresh fetch
  shouldFetchFlagDefinitions() {
    return true;
  }

  async onFlagDefinitionsReceived(data) {
    const incoming = JSON.stringify(data);
    if (this.existingRaw === incoming) {
      // ← reuses what the reader already fetched
      console.log("[KV] flag definitions unchanged — skipping write");
      return;
    }
    await this.kv.put(this.cacheKey, incoming, { expirationTtl: KV_TTL });
    console.log("[KV] flag definitions updated");
  }

  shutdown() {}
}
```

The original writer did its own `kv.get()` inside `onFlagDefinitionsReceived` just to compare whether the definitions had changed before writing. That's a wasted read on every background refresh. Since the reader already fetched and stored the raw string in `this._raw`, we pass it to the writer and skip the redundant read entirely.

```javascript
// BEFORE — writer did its own kv.get(), burning an extra read operation
async onFlagDefinitionsReceived(data) {
  const incoming = JSON.stringify(data);
  const existing = await this.kv.get(this.cacheKey).catch(() => null); // ← extra KV read
  if (existing === incoming) return;
  await this.kv.put(this.cacheKey, incoming);
}

// AFTER — zero extra KV reads, the string we already have is reused for comparison
async onFlagDefinitionsReceived(data) {
  const incoming = JSON.stringify(data);
  if (this.existingRaw === incoming) return; // ← reuses what the reader already fetched
  await this.kv.put(this.cacheKey, incoming);
}

```

### Silent Background Refresh via `waitUntil`

KV definitions are refreshed asynchronously after the response is sent, so staleness never blocks a user. If KV is empty on first load, we serve the control variant and schedule a background refresh — the next request gets the correct definitions.

```javascript
// background refresh — spawned via waitUntil, never blocks the response
async function refreshFlagDefinitionsInBackground(env, existingRaw) {
  const cache = new CloudflareKVFlagCacheWriter(
    env.hyperspeed,
    env.POSTHOG_TOKEN,
    existingRaw
  );
  const posthog = new PostHog(env.POSTHOG_TOKEN, {
    host: env.POSTHOG_HOST,
    personalApiKey: env.POSTHOG_PERSONAL_API_KEY,
    enableLocalEvaluation: true,
    flagDefinitionCacheProvider: cache,
    featureFlagsPollingInterval: 0,
    flushAt: 1,
    flushInterval: 0,
  });
  try {
    await posthog.waitForLocalEvaluationReady();
  } catch (err) {
    console.error("[PostHog] background KV refresh failed:", err?.message);
  } finally {
    await posthog.shutdown();
  }
}
```

### Flag Resolution — Three Steps, Zero Network Calls

```javascript
async function resolveFlag(posthog, cache, distinctId, env, waitUntil) {
  // 1. Read KV once. If empty → trigger background refresh, return null.
  const defs = await cache.getFlagDefinitions(); // hits memoized Promise — no double KV read

  if (!defs) {
    console.log(
      "[PostHog] KV miss — scheduling background refresh, serving control"
    );
    waitUntil(refreshFlagDefinitionsInBackground(env, null));
    return null;
  }

  // 2. Evaluate flag locally using the KV-backed cache provider.
  const variant = await posthog.getFeatureFlag(FLAG_KEY, distinctId, {
    onlyEvaluateLocally: true,
  });

  if (!variant || variant === false || variant === "control") return null;

  // 3. Extract payload directly from the defs already in memory — no second KV read,
  //    no getFeatureFlagPayload (unreliable with onlyEvaluateLocally in Node SDK)
  const flagDef = defs.flags?.find(f => f.key === FLAG_KEY);
  const rawPayload = flagDef?.filters?.payloads?.[variant];

  if (!rawPayload) return null;

  const parsedPayload =
    typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  return { variant, payload: parsedPayload };
}
```

Step 3 is particularly critical: we extract the payload directly from the definitions object already in memory rather than calling `getFeatureFlagPayload()`. This avoids a second KV read and sidesteps a known reliability issue with the PostHog Node SDK when executing `onlyEvaluateLocally`.

---

## Final Polish: Precompiled Regex

One last micro-optimization — bot detection regex is compiled once at module load time rather than inside the request execution lifecycle:

```javascript
// compiled once at module load time, not per-request
const BOT_RE = /bot|crawler|spider|exporter|monitor|prerender/i;
```

Small, but it adds up across millions of incoming edge requests.

---

## Closing the Loop: Client-Side Bootstrap

On the client, we bootstrap PostHog with the server-resolved state from cookies so the client SDK never has to re-fetch the flags. It stays in sync with exactly what the edge layer already served, eliminating any downstream round-trips.

```javascript
// read the cookies written by the CF Worker
function getPHCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

const serverDistinctId = getPHCookie("ph_distinct_id");
const serverVariant = getPHCookie("ph_hero_variant");

const bootstrapConfig = {};
if (serverDistinctId) bootstrapConfig.distinctID = serverDistinctId;
if (serverVariant)
  bootstrapConfig.featureFlags = { "hero-section": serverVariant };

posthog.init("phc_...", {
  api_host: "[https://posthog.lyoko.studio](https://posthog.lyoko.studio)",
  bootstrap: bootstrapConfig, // client uses server state — no re-fetch
  defaults: "2026-01-30",
  person_profiles: "identified_only",
});
```

---

## Final Thoughts & Performance Results

> Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it. And to make things worse: complexity sells better. — Edsger Dijkstra

Shifting from standard client-side tracking components to raw edge infrastructure requires upfront architectural overhead, but the performance dividends are undeniable. Combined, these architectural changes took us from a visible content flash plus a 2–3 second flag-fetch delay, all the way to instantaneous loads with zero layout shift.

### The Full Optimization Stack (In Order of Impact)

- **KV-Backed Local Evaluation**: Eliminates the external PostHog network round-trip entirely.
- **`waitUntil` Background Refresh**: Async staleness updates ensure that fetching never blocks an active user response.
- **Streaming `HTMLRewriter`**: Native C++ tokenization drops memory buffering, regex parsing, and heavy string allocations.
- **Variant + Payload Cookies**: Results in zero PostHog or KV evaluations required for returning visitors.
- **Parallel Page + Flag Fetch**: Limits cold start delays to $\max(\text{page}, \text{posthog})$ instead of their sum.
- **Writer In-Memory Re-Use**: Cuts KV read metrics by 50% during background synchronizations.
- **Precompiled Regex**: Eliminates compilation overhead at request execution time.

## TL;DR

By moving A/B test flag resolution from client-side JavaScript to a Cloudflare Worker backed by local evaluation inside Cloudflare KV, we eliminated layout shifts and the "flash of unstyled content" entirely. Utilizing native tools like `HTMLRewriter` and passing execution contexts to async background processes allowed us to evaluate variants and transform HTML inline with zero added latency. The setup is currently serving production traffic instantly on `hyperspeed.live` and `robinsconsulting.com`.
