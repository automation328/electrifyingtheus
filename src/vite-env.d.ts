/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (G-XXXXXXXXXX). When unset, analytics is a no-op. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
