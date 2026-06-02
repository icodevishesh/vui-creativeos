---
name: react-performance
description: React and Next.js performance optimization patterns. 70+ rules across 8 priority categories — waterfalls, bundle size, server-side, client fetching, re-render, rendering, JS micro-perf, advanced. Use when writing, reviewing, or refactoring React/Next.js code for performance.
---

# React Performance

Performance optimization patterns for React 18/19 and Next.js.

## Priority Index

| Priority | Category | When it matters |
|----------|----------|----------------|
| 1 — CRITICAL | Eliminating Waterfalls | Anytime `await` is followed by independent `await` |
| 2 — CRITICAL | Bundle Size Optimization | First-load JS, route-level imports, third-party libs |
| 3 — HIGH | Server-Side Performance | RSC, Server Actions, API routes, SSR |
| 4 — MEDIUM-HIGH | Client-Side Data Fetching | SWR / TanStack Query / raw fetch in hooks |
| 5 — MEDIUM | Re-render Optimization | High-frequency state updates, parent-child fan-out |
| 6 — MEDIUM | Rendering Performance | Long lists, animations, hydration |
| 7 — LOW-MEDIUM | JavaScript Performance | Hot loops, frequent allocations |
| 8 — LOW | Advanced Patterns | Effect-event integration, stable refs |

---

## 1. Eliminating Waterfalls (CRITICAL)

> Waterfalls are the #1 performance killer — every sequential `await` adds full network latency.

### Check sync conditions before awaiting

```ts
// INCORRECT
async function Page({ id }) {
  const flag = await getFlag("show-page");
  if (!flag || !id) return null;
  const data = await getData(id);
}

// CORRECT — short-circuit on cheap sync condition first
async function Page({ id }) {
  if (!id) return null;
  const flag = await getFlag("show-page");
  if (!flag) return null;
  const data = await getData(id);
}
```

### Promise.all for independent work

```ts
// INCORRECT — sequential (wastes time)
const user    = await getUser(id);
const posts   = await getPosts(id);
const followers = await getFollowers(id);

// CORRECT — parallel
const [user, posts, followers] = await Promise.all([
  getUser(id), getPosts(id), getFollowers(id),
]);
```

### Start early, await late

```ts
// Kick off all promises, await only when each result is needed
const userP = getUser(id);
const postsP = getPosts(id);
const profile = await getProfile(id);
if (profile.private) return null;
const [user, posts] = await Promise.all([userP, postsP]);
```

### Server Components: parallel through composition

```tsx
// INCORRECT — siblings run sequentially inside one component
export default async function Page() {
  const user = await getUser();
  const cart = await getCart();
  return <View user={user} cart={cart} />;
}

// CORRECT — split into children, React runs them in parallel
export default async function Page() {
  return <View><UserSection /><CartSection /></View>;
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### Direct imports, not barrels

```ts
// INCORRECT — forces bundler to walk entire module graph
import { Button, Card, Modal } from "@/components";

// CORRECT
import { Button } from "@/components/Button";
import { Card }   from "@/components/Card";
import { Modal }  from "@/components/Modal";
```

### Dynamic imports for heavy components

```ts
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton />,
  ssr: false, // when client-only
});
```

### Conditional module loading

```ts
if (user.role === "admin") {
  const { AdminPanel } = await import("./admin/AdminPanel");
}
```

### Defer third-party scripts

Use `next/script` with `strategy="afterInteractive"` or `"lazyOnload"` for analytics, support widgets, etc.

---

## 3. Server-Side Performance (HIGH)

### React.cache() for per-request deduplication

```ts
import { cache } from "react";

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});
// Calling getUser("1") from 3 Server Components = 1 DB query
```

### after() for non-blocking work

```ts
import { after } from "next/server";

export async function GET() {
  const data = await getData();
  after(() => logAnalytics(data)); // runs after response is sent
  return Response.json(data);
}
```

### No mutable module-level state in RSC/SSR

Module state is shared across all requests — race condition between users. Use request-scoped storage (headers(), cookies()) instead.

### Minimize data passed to Client Components

Only serialize what the client needs. Strip fields, paginate, project columns at the DB layer.

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### SWR / TanStack Query for deduplication

Multiple components calling `useUser(id)` should share one network request. Use SWR or TanStack Query — never roll your own `useEffect + fetch` for shared data.

### Passive event listeners

```ts
window.addEventListener("scroll", handler, { passive: true });
```

---

## 5. Re-render Optimization (MEDIUM)

### Don't subscribe to state used only in callbacks

```ts
// INCORRECT — re-renders every time count changes
const count = useStore((s) => s.count);
const handler = () => doSomething(count);

// CORRECT — read once on call
const handler = () => {
  const count = useStore.getState().count;
  doSomething(count);
};
```

### Hoist default non-primitive props

```tsx
// INCORRECT — new array each render breaks memo
<List items={items ?? []} />

// CORRECT
const EMPTY: Item[] = [];
<List items={items ?? EMPTY} />
```

### Subscribe to derived booleans, not raw values

```ts
// INCORRECT — re-renders for any cart change
const cart = useStore((s) => s.cart);
const hasItems = cart.length > 0;

// CORRECT — re-renders only when emptiness flips
const hasItems = useStore((s) => s.cart.length > 0);
```

### Derive during render, never via useEffect

```ts
// INCORRECT
const [full, setFull] = useState("");
useEffect(() => setFull(`${first} ${last}`), [first, last]);

// CORRECT
const full = `${first} ${last}`;
```

### Functional setState for stable callbacks

```ts
const increment = useCallback(() => setCount((c) => c + 1), []);
```

### startTransition for non-urgent updates

```ts
const [pending, startTransition] = useTransition();
startTransition(() => setFilters(newFilters));
```

### useDeferredValue for expensive renders

```ts
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => expensiveSearch(deferredQuery), [deferredQuery]);
```

### Don't define components inside components

```tsx
// INCORRECT — Inner is a new component on every Outer render
function Outer() {
  const Inner = () => <span />;
  return <Inner />;
}
```

---

## 6. Rendering Performance (MEDIUM)

### content-visibility: auto for long lists

```css
.row { content-visibility: auto; contain-intrinsic-size: auto 80px; }
```

### Hoist static JSX

```tsx
const STATIC_HEADER = <h1>Title</h1>;
function Page() {
  return <>{STATIC_HEADER}<Body /></>;
}
```

### Ternary over && for conditional render

```tsx
// INCORRECT — `0` renders as text node
{count && <Badge>{count}</Badge>}

// CORRECT
{count > 0 ? <Badge>{count}</Badge> : null}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

- **Map** for repeated lookups — O(1) vs O(n) linear scan
- **Set/Map** for membership — O(1) vs `Array.includes` O(n)
- Combine `filter().map()` into one pass — `flatMap` or single `for`
- Check array length first before expensive comparisons
- Early return from functions
- Hoist `RegExp` out of loops — compilation is not free
- Loop for min/max instead of `sort()` — O(n) vs O(n log n)
- `toSorted()` over mutation when immutability matters
- `requestIdleCallback` for non-critical work

---

## 8. Advanced Patterns (LOW)

### Stable callback refs

```ts
const handlerRef = useRef(handler);
useEffect(() => { handlerRef.current = handler; });
const stable = useCallback((arg) => handlerRef.current(arg), []);
```

### useLatest for stable callback refs

```ts
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
```
