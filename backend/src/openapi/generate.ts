import fs from "node:fs";
import path from "node:path";
import { buildOpenApiSpec } from "./spec";

export function generateOpenApiSpec(): void {
  const spec = buildOpenApiSpec();
  const jsonContent = JSON.stringify(spec, null, 2);

  const primaryTarget = path.resolve(process.cwd(), "docs/openapi.json");
  const fallbackTarget = path.resolve(process.cwd(), "../docs/openapi.json");
  const outputPath = fs.existsSync(path.dirname(primaryTarget)) ? primaryTarget : fallbackTarget;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${jsonContent}\n`, "utf-8");

  const pathCount = Object.keys(spec.paths).length;
  console.log(
    `[OpenAPI] Successfully generated OpenAPI 3.1.0 specification with ${pathCount} paths at: ${outputPath}`,
  );
}

// Execute directly if run via CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("generate.ts")) {
  generateOpenApiSpec();
}
