import { UserRole } from "@/types/database";

export const ROLES: Record<string, UserRole> = {
  STAF: "staf",
  AKUNTAN: "akuntan",
  DIREKTUR: "direktur",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  staf: "Staf",
  akuntan: "Akuntan",
  direktur: "Direktur",
};
