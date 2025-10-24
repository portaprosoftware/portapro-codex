/**
 * Dynamic loader for Recharts
 * Prevents recharts from landing in main bundle
 */

export async function loadChartsLibs() {
  return await import('recharts');
}

export type RechartsLib = Awaited<ReturnType<typeof loadChartsLibs>>;
