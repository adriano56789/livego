// Type definitions for Service Worker events
declare interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}

declare interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(response: Promise<Response> | Response): Promise<Response>;
}

// Extend the global Window interface
declare interface Window {
  __WB_MANIFEST: string[];
  skipWaiting(): void;
}

// Extend the global ServiceWorkerGlobalScope interface
declare var self: ServiceWorkerGlobalScope;
