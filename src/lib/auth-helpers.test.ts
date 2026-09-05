import { describe, it, expect } from "vitest";
import { isSuperAdminEmail, resolveEffectiveRole } from "./auth-helpers";

describe("auth-helpers: isSuperAdminEmail", () => {
  it("deve reconhecer wagnertecnoia@gmail.com como superadmin incondicionalmente", () => {
    expect(isSuperAdminEmail("wagnertecnoia@gmail.com")).toBe(true);
    expect(isSuperAdminEmail("  WAGNERTECNOIA@GMAIL.COM ")).toBe(true);
  });

  it("deve reconhecer o e-mail configurado na variável de ambiente, mesmo com aspas", () => {
    expect(isSuperAdminEmail("admin@condominio.com", '"admin@condominio.com"')).toBe(true);
    expect(isSuperAdminEmail("admin@condominio.com", "'admin@condominio.com'")).toBe(true);
    expect(isSuperAdminEmail("ADMIN@CONDOMINIO.COM", "admin@condominio.com")).toBe(true);
  });

  it("deve retornar false para e-mails comuns de moradores ou sindicos", () => {
    expect(isSuperAdminEmail("morador@gmail.com")).toBe(false);
    expect(isSuperAdminEmail("sindica@edificio.com", "admin@root.com")).toBe(false);
  });

  it("deve tratar entradas nulas, indefinidas ou vazias com segurança", () => {
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
    expect(isSuperAdminEmail("")).toBe(false);
    expect(isSuperAdminEmail("   ")).toBe(false);
  });
});

describe("auth-helpers: resolveEffectiveRole", () => {
  it("deve sempre atribuir 'superadmin' para o e-mail do super admin, independente da role salva no banco", () => {
    expect(
      resolveEffectiveRole({
        email: "wagnertecnoia@gmail.com",
        role: "morador",
      })
    ).toBe("superadmin");

    expect(
      resolveEffectiveRole({
        email: "wagnertecnoia@gmail.com",
        role: "pending",
      })
    ).toBe("superadmin");
  });

  it("deve respeitar a role 'sindica' para usuários autorizados", () => {
    expect(
      resolveEffectiveRole({
        email: "sindica@condo.com",
        role: "sindica",
      })
    ).toBe("sindica");
  });

  it("deve respeitar status 'pending' para novos cadastros", () => {
    expect(
      resolveEffectiveRole({
        email: "novo@condo.com",
        role: "pending",
      })
    ).toBe("pending");
  });

  it("deve retornar 'morador' como padrão para usuários regulares sem role explícita", () => {
    expect(
      resolveEffectiveRole({
        email: "morador@condo.com",
        role: null,
      })
    ).toBe("morador");
  });
});
