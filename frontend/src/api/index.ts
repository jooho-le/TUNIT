import { createMockApi } from "./mock";
import { createHttpApi } from "./http";
export const apiMode = import.meta.env.VITE_API_MODE || "mock";
if (!["mock", "http"].includes(apiMode))
  throw new Error("VITE_API_MODE는 mock 또는 http여야 합니다.");
const adapter = apiMode === "http" ? createHttpApi() : createMockApi();
export const api = new Proxy(adapter, {
  get(target, property, receiver) {
    const method = Reflect.get(target, property, receiver);
    if (typeof method !== "function") return method;
    return async (...args: unknown[]) => {
      try {
        return await method(...args);
      } catch (error) {
        if (
          error instanceof Error &&
          "status" in error &&
          error.status === 401 &&
          typeof property === "string" &&
          !["login", "signup", "me"].includes(property)
        )
          window.dispatchEvent(new Event("tunit:unauthorized"));
        throw error;
      }
    };
  },
});
export { ApiError } from "./types";
