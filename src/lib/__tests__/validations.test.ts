import { describe, it, expect } from "vitest";
import {
  SignupSchema,
  LoginSchema,
  ProfileSchema,
  EditAccountSchema,
  MotorcycleSchema,
  MotorcycleEditSchema,
} from "@/lib/validations";

const CURRENT_YEAR = new Date().getFullYear();

// ─── SignupSchema ────────────────────────────────────────────────────────────
describe("SignupSchema", () => {
  const valid = { name: "João Silva", username: "joao_01", email: "joao@email.com", password: "senha123" };

  it("accepts valid data", () => {
    expect(SignupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const r = SignupSchema.safeParse({ ...valid, name: "J" });
    expect(r.success).toBe(false);
    expect(r.error?.flatten().fieldErrors.name).toBeDefined();
  });

  it("rejects username shorter than 3 chars", () => {
    const r = SignupSchema.safeParse({ ...valid, username: "ab" });
    expect(r.success).toBe(false);
  });

  it("rejects username longer than 30 chars", () => {
    const r = SignupSchema.safeParse({ ...valid, username: "a".repeat(31) });
    expect(r.success).toBe(false);
  });

  it("rejects username with uppercase letters", () => {
    const r = SignupSchema.safeParse({ ...valid, username: "JoaoSilva" });
    expect(r.success).toBe(false);
  });

  it("rejects username with special characters", () => {
    const r = SignupSchema.safeParse({ ...valid, username: "joao-silva" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = SignupSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(r.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const r = SignupSchema.safeParse({ ...valid, password: "abc123" });
    expect(r.success).toBe(false);
  });

  it("trims whitespace from username", () => {
    const r = SignupSchema.safeParse({ ...valid, username: "  joao  " });
    expect(r.success).toBe(false); // spaces fail regex
  });
});

// ─── LoginSchema ─────────────────────────────────────────────────────────────
describe("LoginSchema", () => {
  it("accepts valid data", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(LoginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

// ─── ProfileSchema ───────────────────────────────────────────────────────────
describe("ProfileSchema", () => {
  it("accepts valid data with all fields", () => {
    expect(ProfileSchema.safeParse({ name: "Ana", bio: "Moto lover", is_private: false }).success).toBe(true);
  });

  it("accepts without optional bio", () => {
    expect(ProfileSchema.safeParse({ name: "Ana" }).success).toBe(true);
  });

  it("accepts without optional is_private", () => {
    expect(ProfileSchema.safeParse({ name: "Ana", bio: "ok" }).success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    expect(ProfileSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects bio longer than 160 chars", () => {
    expect(ProfileSchema.safeParse({ name: "Ana", bio: "x".repeat(161) }).success).toBe(false);
  });
});

// ─── EditAccountSchema ───────────────────────────────────────────────────────
describe("EditAccountSchema", () => {
  const valid = { username: "novo_user", email: "novo@email.com" };

  it("accepts valid data", () => {
    expect(EditAccountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid username", () => {
    expect(EditAccountSchema.safeParse({ ...valid, username: "AB" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(EditAccountSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
});

// ─── MotorcycleSchema ────────────────────────────────────────────────────────
describe("MotorcycleSchema", () => {
  const valid = { brand: "Honda", model: "CB500", year: String(CURRENT_YEAR) };

  it("accepts valid minimal data", () => {
    const r = MotorcycleSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.year).toBe(CURRENT_YEAR);
  });

  it("accepts with all optional fields", () => {
    const r = MotorcycleSchema.safeParse({
      ...valid,
      license_plate: "ABC1234",
      owned_from: "2020",
      owned_until: "2023",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.owned_from).toBe(2020);
      expect(r.data.owned_until).toBe(2023);
    }
  });

  it("rejects missing brand", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, brand: "" }).success).toBe(false);
  });

  it("rejects missing model", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, model: "" }).success).toBe(false);
  });

  it("rejects non-4-digit year", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, year: "99" }).success).toBe(false);
  });

  it("rejects year before 1900", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, year: "1899" }).success).toBe(false);
  });

  it("rejects year beyond currentYear+1", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, year: String(CURRENT_YEAR + 2) }).success).toBe(false);
  });

  it("rejects license_plate longer than 10 chars", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, license_plate: "12345678901" }).success).toBe(false);
  });

  it("treats empty string owned_from as undefined", () => {
    const r = MotorcycleSchema.safeParse({ ...valid, owned_from: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.owned_from).toBeUndefined();
  });

  it("treats null owned_until as undefined", () => {
    const r = MotorcycleSchema.safeParse({ ...valid, owned_until: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.owned_until).toBeUndefined();
  });

  it("rejects invalid optional year format", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, owned_from: "20" }).success).toBe(false);
  });

  it("rejects optional year before 1900", () => {
    expect(MotorcycleSchema.safeParse({ ...valid, owned_from: "1899" }).success).toBe(false);
  });
});

// ─── MotorcycleEditSchema ────────────────────────────────────────────────────
describe("MotorcycleEditSchema", () => {
  const valid = { id: "clxxx", brand: "Honda", model: "CB500", year: String(CURRENT_YEAR) };

  it("accepts valid data", () => {
    expect(MotorcycleEditSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing id", () => {
    expect(MotorcycleEditSchema.safeParse({ ...valid, id: "" }).success).toBe(false);
  });

  it("rejects invalid year", () => {
    expect(MotorcycleEditSchema.safeParse({ ...valid, year: "abcd" }).success).toBe(false);
  });
});
