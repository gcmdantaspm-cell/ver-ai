// Prevent polyfills from crashing the app due to window.fetch getter-only properties in strict iframes
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  try {
    Object.defineProperty(window, 'fetch', {
      get: () => originalFetch,
      set: () => { /* safely ignore polyfill overrides */ },
      configurable: true
    });
  } catch (e) {
    // ignore if already defined
  }
}
