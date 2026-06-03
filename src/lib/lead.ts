// Shared lead-capture shape for EVan (home chat + /assistant).
export type Lead = {
  fullName: string;
  email: string;
};

export const EMPTY_LEAD: Lead = {
  fullName: "",
  email: "",
};

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
