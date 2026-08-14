/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist, StaleWhileRevalidate, CacheableResponsePlugin } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Stratégie Supabase (Cross-Origin Opaque Responses)
    {
      matcher: ({ url }) => url.href.includes("supabase.co/rest/v1"),
      handler: new StaleWhileRevalidate({
        cacheName: "supabase-api-cache",
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200], // Opaque + OK
          }),
        ],
      }),
    },
    // 2. Stratégie native Next.js App Router (RSC & HTML)
    ...defaultCache,
  ],
});

serwist.addEventListeners();