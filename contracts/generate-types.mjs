import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const input = new URL("./backend-foundation.openapi.json", import.meta.url);
const output = new URL("../frontend/src/api/generated.ts", import.meta.url);
const spec = JSON.parse(readFileSync(input, "utf8"));
function type(schema) {
  if (schema.$ref) return schema.$ref.split("/").at(-1);
  if (schema.anyOf || schema.oneOf) return (schema.anyOf ?? schema.oneOf).map(type).join(" | ");
  if (schema.enum) return schema.enum.map(value => JSON.stringify(value)).join(" | ");
  if (Array.isArray(schema.type)) return schema.type.map(value => type({ ...schema, type: value })).join(" | ");
  if (schema.type === "array") return `Array<${type(schema.items ?? {})}>`;
  if (schema.type === "object") return `{ ${Object.entries(schema.properties ?? {}).map(([key, value]) => `${JSON.stringify(key)}${schema.required?.includes(key) ? "" : "?"}: ${type(value)};`).join(" ")} }`;
  return ({ string: "string", integer: "number", number: "number", boolean: "boolean", null: "null" })[schema.type] ?? "unknown";
}
const text = "// Generated from contracts/backend-foundation.openapi.json. Run: node contracts/generate-types.mjs\n" +
  Object.entries(spec.components.schemas).map(([name, schema]) => `export type ${name} = ${type(schema)};`).join("\n") + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== text) throw new Error("OpenAPI TypeScript types are stale");
  console.log("PASS: OpenAPI TypeScript types match");
} else { writeFileSync(output, text); console.log(`Generated ${fileURLToPath(output)}`); }
