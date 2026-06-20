// src/lib/performance.ts
export async function trace<T>(name: string, fn: () => Promise<T>) {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = Math.round(end - start);
  // lightweight console trace — you can also send this to analytics/performance collection
  console.info(`TRACE ${name}: ${duration}ms`);
  try {
    // optional: send to analytics event
    // import dynamically to avoid bundling server SDKs
    // trackGeneric(`trace_${name}`, { duration });
  } catch (e) {
    /* ignore */
  }
  return result;
}
