import { describe, it, expect } from "vitest";
import {
  ticketSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpSchema,
  addressSchema,
  reviewSchema,
  password,
} from "../src/validation/schemas.js";
import { validate } from "../src/validation/validate.js";

const okRegister = {
  name: "Sam Ahmed",
  email: "sam@example.com",
  phone: "+201234567890",
  password: "Secret123",
  acceptTerms: true,
};

describe("password rule (same as backend)", () => {
  it("needs 8-72 chars with a letter and a digit", () => {
    expect(password.safeParse("Secret123").success).toBe(true);
    for (const bad of [
      "short1",
      "allletters",
      "12345678",
      "x".repeat(73) + "1",
    ])
      expect(password.safeParse(bad).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a valid form", () => {
    expect(validate(registerSchema, okRegister).ok).toBe(true);
  });
  it("reports one i18n key per bad field", () => {
    const r = validate(registerSchema, {
      name: "S",
      email: "nope",
      phone: "123",
      password: "abc",
      acceptTerms: false,
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({
      name: "validation.nameShort",
      email: "validation.emailInvalid",
      phone: "validation.phoneInvalid",
      password: "validation.passwordMin",
      acceptTerms: "validation.termsRequired",
    });
  });
  it("the terms box must be exactly true (missing counts as unchecked)", () => {
    const { acceptTerms, ...rest } = okRegister;
    expect(validate(registerSchema, rest).errors.acceptTerms).toBe(
      "validation.termsRequired",
    );
  });
  it("trims name and email", () => {
    expect(
      validate(registerSchema, {
        ...okRegister,
        name: "  Sam Ahmed ",
        email: " sam@example.com ",
      }).values,
    ).toMatchObject({ name: "Sam Ahmed", email: "sam@example.com" });
  });
});

describe("other schemas", () => {
  it("login", () => {
    expect(
      validate(loginSchema, { identifier: "", password: "" }).errors,
    ).toEqual({
      identifier: "validation.identifierRequired",
      password: "validation.passwordRequired",
    });
    expect(
      validate(loginSchema, { identifier: "a@b.co", password: "x" }).ok,
    ).toBe(true);
  });
  it("forgot / reset", () => {
    expect(validate(forgotPasswordSchema, { email: "x" }).ok).toBe(false);
    expect(validate(resetPasswordSchema, { newPassword: "Secret123" }).ok).toBe(
      true,
    );
    expect(validate(resetPasswordSchema, { newPassword: "secret" }).ok).toBe(
      false,
    );
  });
  it("otp", () => {
    expect(validate(otpSchema, { code: "123456" }).ok).toBe(true);
    expect(validate(otpSchema, { code: "12345" }).errors.code).toBe(
      "validation.otpLength",
    );
    expect(validate(otpSchema, { code: "12345a" }).errors.code).toBe(
      "validation.otpDigits",
    );
  });
  it("address and review", () => {
    expect(
      validate(addressSchema, {
        label: "Home",
        line1: "12 Nile St",
        city: "Damietta",
      }).ok,
    ).toBe(true);
    expect(
      validate(addressSchema, { label: "", line1: "ab", city: "x" }).ok,
    ).toBe(false);
    expect(validate(reviewSchema, { rating: 5, comment: "Great" }).ok).toBe(
      true,
    );
    expect(validate(reviewSchema, { rating: 0 }).ok).toBe(false);
  });
});

describe("ticketSchema", () => {
  const ok = {
    subject: "Late order",
    body: "My order is very late, please help.",
    category: "ORDER",
  };
  it("accepts a normal ticket (order link optional)", () => {
    expect(validate(ticketSchema, ok).ok).toBe(true);
    expect(
      validate(ticketSchema, {
        ...ok,
        orderId: "11111111-1111-4111-8111-111111111111",
      }).ok,
    ).toBe(true);
  });
  it("reports i18n keys for short subject/body and rejects unknown categories and non-uuid order ids", () => {
    expect(
      validate(ticketSchema, { ...ok, subject: "Hi", body: "short" }).errors,
    ).toEqual({
      subject: "validation.ticketSubject",
      body: "validation.ticketBody",
    });
    expect(validate(ticketSchema, { ...ok, category: "HACK" }).ok).toBe(false);
    expect(validate(ticketSchema, { ...ok, orderId: "not-a-uuid" }).ok).toBe(
      false,
    );
  });
});
