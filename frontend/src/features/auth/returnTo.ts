export function safeReturn(value: string | null) {
  return value && /^\/invite\/[A-Za-z0-9_-]+$/.test(value) ? value : "/home";
}
