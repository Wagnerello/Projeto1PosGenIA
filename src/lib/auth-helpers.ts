/**
 * Utilitários puros de autorização e resolução de papéis (RBAC).
 */

export const isSuperAdminEmail = (
  email?: string | null,
  configuredEnv?: string | null
): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // E-mail mestre/root do administrador do sistema
  if (cleanEmail === "wagnertecnoia@gmail.com") {
    return true;
  }

  if (configuredEnv) {
    const cleanConfigured = configuredEnv
      .replace(/^["']|["']$/g, "")
      .trim()
      .toLowerCase();
    if (cleanConfigured && cleanEmail === cleanConfigured) {
      return true;
    }
  }

  return false;
};

export type UserRole = "superadmin" | "sindica" | "zelador" | "portaria" | "morador" | "pending" | "rejected";

export const resolveEffectiveRole = (params: {
  role?: string | null;
  email?: string | null;
  configuredEnv?: string | null;
}): UserRole => {
  if (isSuperAdminEmail(params.email, params.configuredEnv)) {
    return "superadmin";
  }

  if (params.role === "sindica") return "sindica";
  if (params.role === "zelador") return "zelador";
  if (params.role === "portaria") return "portaria";
  if (params.role === "morador") return "morador";
  if (params.role === "pending") return "pending";
  if (params.role === "rejected") return "rejected";

  return "morador";
};
