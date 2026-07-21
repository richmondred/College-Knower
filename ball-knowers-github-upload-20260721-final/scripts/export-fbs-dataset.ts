import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fbs2026Dataset } from "@/data/fbs/fbs-2026.1";

const output = resolve(process.argv[2] ?? "outputs/fbs-2026.1.json");
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(fbs2026Dataset, null, 2)}\n`, "utf8");
console.log(`Exported ${fbs2026Dataset.datasetVersion} to ${output}`);
