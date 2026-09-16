// Identity data for the electrified vehicles ETUS knows about.
//
// This exists separately from src/data/vehicles.ts because the marketplace's
// serverless function needs the model list, and vehicles.ts imports .jpg assets
// for its fallback photos. A Vercel Node function cannot import an image, so
// importing vehicles.ts server-side crashes the function at runtime.
//
// So: no imports, no assets, no framework — just the facts needed to recognise a
// dealer listing as a car we know and to describe it. src/data/ev-catalog.sync.test.ts
// fails if this drifts out of step with the catalog vehicles.ts actually renders.

export interface EvCatalogEntry {
  /** Matches the vehicles.ts id, so the client can join back to full data. */
  id: string;
  make: string;
  model: string;
  /** EPA range in miles, where the catalog knows it. */
  rangeMi?: number;
  /**
   * Extra names dealers genuinely use, e.g. "Mach-E" without the "Mustang".
   *
   * Curated by hand on purpose. A generated rule that simply dropped leading
   * words produced the alias "xDrive40" from BMW's electric "iX xDrive40" — and
   * that alias then matched the PETROL "BMW X5 xDrive40i" and would have
   * presented it as an EV. Trim codes are not model names. Add entries here
   * only when a real listing uses the short form.
   */
  aliases?: string[];
}

/** Derived from the EVs in vehicles.ts. Keep in step — the sync test enforces it. */
export const EV_CATALOG: EvCatalogEntry[] = [
  { id: "tesla-model-3", make: "Tesla", model: "Model 3", rangeMi: 321 },
  { id: "tesla-model-3-performance", make: "Tesla", model: "Model 3 Performance", rangeMi: 314 },
  { id: "hyundai-ioniq-6", make: "Hyundai", model: "IONIQ 6", rangeMi: 342 },
  { id: "polestar-2", make: "Polestar", model: "2", rangeMi: 314 },
  { id: "bmw-i4", make: "BMW", model: "i4", rangeMi: 301 },
  { id: "bmw-i5", make: "BMW", model: "i5", rangeMi: 295 },
  { id: "mercedes-eqe", make: "Mercedes-Benz", model: "EQE", rangeMi: 308 },
  { id: "lucid-air", make: "Lucid", model: "Air", rangeMi: 420 },
  { id: "tesla-model-y", make: "Tesla", model: "Model Y", rangeMi: 310 },
  { id: "chevy-equinox-ev", make: "Chevrolet", model: "Equinox EV", rangeMi: 319 },
  { id: "hyundai-ioniq-5", make: "Hyundai", model: "IONIQ 5", rangeMi: 303 },
  { id: "kia-ev6", make: "Kia", model: "EV6", rangeMi: 310 },
  { id: "ford-mustang-mach-e", make: "Ford", model: "Mustang Mach-E", rangeMi: 290, aliases: ["Mach-E"] },
  { id: "vw-id4", make: "Volkswagen", model: "ID.4", rangeMi: 291 },
  { id: "nissan-ariya", make: "Nissan", model: "Ariya", rangeMi: 289 },
  { id: "ford-mustang-mach-e-gt", make: "Ford", model: "Mustang Mach-E GT", rangeMi: 280, aliases: ["Mach-E GT"] },
  { id: "hyundai-ioniq-5-n", make: "Hyundai", model: "IONIQ 5 N", rangeMi: 221 },
  { id: "kia-ev9", make: "Kia", model: "EV9", rangeMi: 305 },
  { id: "rivian-r1s", make: "Rivian", model: "R1S", rangeMi: 320 },
  { id: "chevy-silverado-ev", make: "Chevrolet", model: "Silverado EV", rangeMi: 440 },
  { id: "rivian-r1t", make: "Rivian", model: "R1T", rangeMi: 328 },
  { id: "acura-zdx", make: "Acura", model: "ZDX", rangeMi: 313 },
  { id: "audi-q4-etron", make: "Audi", model: "Q4 e-tron", rangeMi: 258 },
  { id: "audi-q6-etron", make: "Audi", model: "Q6 e-tron", rangeMi: 310 },
  { id: "bmw-ix-xdrive40", make: "BMW", model: "iX xDrive40", rangeMi: 217 },
  { id: "cadillac-lyriq", make: "Cadillac", model: "LYRIQ", rangeMi: 314 },
  { id: "cadillac-optiq", make: "Cadillac", model: "OPTIQ", rangeMi: 302 },
  { id: "cadillac-escalade-iq", make: "Cadillac", model: "ESCALADE IQ", rangeMi: 460 },
  { id: "chevy-bolt-ev", make: "Chevrolet", model: "Bolt", rangeMi: 262 },
  { id: "nissan-leaf", make: "Nissan", model: "LEAF", rangeMi: 303 },
  { id: "genesis-g80-electrified", make: "Genesis", model: "G80 Electrified", rangeMi: 282 },
  { id: "genesis-gv60", make: "Genesis", model: "GV60", rangeMi: 264 },
  { id: "genesis-gv70-electrified", make: "Genesis", model: "GV70 Electrified", rangeMi: 236 },
  { id: "gmc-sierra-ev", make: "GMC", model: "Sierra EV", rangeMi: 390 },
  { id: "gmc-sierra-ev-denali", make: "GMC", model: "Sierra EV Denali", rangeMi: 390 },
  { id: "honda-prologue", make: "Honda", model: "Prologue", rangeMi: 296 },
  { id: "kia-niro-ev", make: "Kia", model: "Niro EV", rangeMi: 253 },
  { id: "mercedes-eqe-suv", make: "Mercedes-Benz", model: "EQE SUV", rangeMi: 253 },
  { id: "mercedes-eqs-580", make: "Mercedes-Benz", model: "EQS 580 4MATIC", rangeMi: 371 },
  { id: "polestar-3", make: "Polestar", model: "3", rangeMi: 315 },
  { id: "toyota-bz4x", make: "Toyota", model: "bZ", rangeMi: 252 },
  { id: "vw-id-buzz", make: "Volkswagen", model: "ID. Buzz", rangeMi: 234 },
  { id: "volvo-ex30", make: "Volvo", model: "EX30", rangeMi: 253 },
  { id: "volvo-ex40", make: "Volvo", model: "EX40", rangeMi: 254 },
  { id: "volvo-ex90", make: "Volvo", model: "EX90", rangeMi: 276 },
  { id: "volvo-c40", make: "Volvo", model: "EC40", rangeMi: 298 },
  { id: "subaru-solterra", make: "Subaru", model: "Solterra", rangeMi: 288 },
  { id: "mini-countryman-electric", make: "Mini", model: "Countryman SE ALL4", rangeMi: 212 },
  { id: "porsche-taycan", make: "Porsche", model: "Taycan", rangeMi: 246 },
  { id: "porsche-macan-electric", make: "Porsche", model: "Macan Electric", rangeMi: 309 },
  { id: "lexus-rz-450e", make: "Lexus", model: "RZ 450e", rangeMi: 220 },
  { id: "vinfast-vf8", make: "VinFast", model: "VF 8", rangeMi: 256 },
  { id: "vinfast-vf9", make: "VinFast", model: "VF 9", rangeMi: 287 },
  { id: "jeep-wagoneer-s", make: "Jeep", model: "Wagoneer S", rangeMi: 294 },
  { id: "dodge-charger-daytona-ev", make: "Dodge", model: "Charger Daytona EV", rangeMi: 308 },
  { id: "fiat-500e", make: "Fiat", model: "500e", rangeMi: 149 },
  { id: "chevy-blazer-ev", make: "Chevrolet", model: "Blazer EV", rangeMi: 320 },
  { id: "bmw-i7", make: "BMW", model: "i7 xDrive60", rangeMi: 308 },
  { id: "mercedes-eqb", make: "Mercedes-Benz", model: "EQB", rangeMi: 227 },
  { id: "hyundai-ioniq-9", make: "Hyundai", model: "IONIQ 9", rangeMi: 335 },
  { id: "lucid-gravity", make: "Lucid", model: "Gravity", rangeMi: 450 },
  { id: "cadillac-vistiq", make: "Cadillac", model: "VISTIQ", rangeMi: 305 },
  { id: "gmc-hummer-ev", make: "GMC", model: "Hummer EV Pickup", rangeMi: 314 },
  { id: "gmc-hummer-ev-suv", make: "GMC", model: "Hummer EV SUV", rangeMi: 303 },
  { id: "jeep-recon", make: "Jeep", model: "Recon", rangeMi: 222 },
  { id: "audi-a6-etron", make: "Audi", model: "A6 e-tron", rangeMi: 377 },
  { id: "audi-e-tron-gt", make: "Audi", model: "e-tron GT", rangeMi: 300 },
  { id: "mercedes-cla-ev", make: "Mercedes-Benz", model: "CLA EV", rangeMi: 310 },
  { id: "mercedes-eqs-suv", make: "Mercedes-Benz", model: "EQS SUV", rangeMi: 305 },
  { id: "cadillac-celestiq", make: "Cadillac", model: "CELESTIQ", rangeMi: 303 },
  { id: "tesla-cybertruck", make: "Tesla", model: "Cybertruck", rangeMi: 325 },
  { id: "polestar-4", make: "Polestar", model: "4", rangeMi: 310 },
  { id: "mercedes-g580-ev", make: "Mercedes-Benz", model: "G 580 (EV)", rangeMi: 239 },
  { id: "bmw-ix3", make: "BMW", model: "iX3", rangeMi: 400 },
  { id: "kia-ev4", make: "Kia", model: "EV4", rangeMi: 330 },
  { id: "rivian-r2", make: "Rivian", model: "R2", rangeMi: 300 },
  { id: "subaru-trailseeker", make: "Subaru", model: "Trailseeker", rangeMi: 281 },
  { id: "subaru-uncharted", make: "Subaru", model: "Uncharted", rangeMi: 290 },
  { id: "volvo-es90", make: "Volvo", model: "ES90", rangeMi: 350 },
  { id: "mercedes-glc-ev", make: "Mercedes-Benz", model: "GLC with EQ Technology", rangeMi: 340 },
  { id: "porsche-cayenne-ev", make: "Porsche", model: "Cayenne Electric", rangeMi: 340 },
  { id: "lotus-eletre", make: "Lotus", model: "Eletre", rangeMi: 265 },
  { id: "lotus-emeya", make: "Lotus", model: "Emeya", rangeMi: 270 },
  { id: "rolls-royce-spectre", make: "Rolls-Royce", model: "Spectre", rangeMi: 291 },
  { id: "maserati-granturismo-folgore", make: "Maserati", model: "GranTurismo Folgore", rangeMi: 233 },
];
