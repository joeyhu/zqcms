import { describe, it, expect } from "bun:test";

describe("Settings Service - Pure Logic", () => {
  describe("Site settings validation", () => {
    interface SiteSettingsInput {
      siteName?: string;
      siteDescription?: string | null;
      primaryColor?: string;
      contactEmail?: string | null;
      gaId?: string | null;
    }

    function validateSettings(input: SiteSettingsInput): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (input.siteName !== undefined && input.siteName.trim().length === 0) {
        errors.push("siteName cannot be empty");
      }

      if (input.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor)) {
        errors.push("primaryColor must be a valid hex color");
      }

      if (input.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail)) {
        errors.push("contactEmail is invalid");
      }

      return { valid: errors.length === 0, errors };
    }

    it("should accept valid settings", () => {
      expect(validateSettings({ siteName: "My Site" }).valid).toBe(true);
    });

    it("should reject empty siteName", () => {
      const result = validateSettings({ siteName: "   " });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("siteName cannot be empty");
    });

    it("should validate hex color", () => {
      expect(validateSettings({ primaryColor: "#FF0000" }).valid).toBe(true);
      expect(validateSettings({ primaryColor: "invalid" }).valid).toBe(false);
    });

    it("should validate email format", () => {
      expect(validateSettings({ contactEmail: "test@example.com" }).valid).toBe(true);
      expect(validateSettings({ contactEmail: "not-an-email" }).valid).toBe(false);
    });

    it("should accept all valid fields together", () => {
      expect(
        validateSettings({
          siteName: "Awesome CMS",
          primaryColor: "#3B82F6",
          contactEmail: "hello@cms.com",
        }).valid
      ).toBe(true);
    });

    it("should accept undefined optional fields", () => {
      expect(validateSettings({}).valid).toBe(true);
    });
  });

  describe("Default settings", () => {
    function getDefaultSettings() {
      return {
        siteName: "ZQCMS",
        siteDescription: "",
        primaryColor: "#3B82F6",
        contactEmail: null,
        contactPhone: null,
        address: null,
        socialLinks: null,
        footerText: null,
        copyright: null,
        gaId: null,
      };
    }

    it("should have required defaults", () => {
      const defaults = getDefaultSettings();
      expect(defaults.siteName).toBe("ZQCMS");
      expect(defaults.primaryColor).toBe("#3B82F6");
    });

    it("should have null for optional fields", () => {
      const defaults = getDefaultSettings();
      expect(defaults.contactEmail).toBeNull();
      expect(defaults.gaId).toBeNull();
    });
  });

  describe("Settings merge logic", () => {
    function mergeSettings(base: Record<string, unknown>, update: Record<string, unknown>) {
      return { ...base, ...Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined)) };
    }

    it("should merge partial updates", () => {
      const base = { siteName: "Old", primaryColor: "#FF0000" };
      const result = mergeSettings(base, { siteName: "New" });
      expect(result.siteName).toBe("New");
      expect(result.primaryColor).toBe("#FF0000");
    });

    it("should keep existing values when not in update", () => {
      const base = { siteName: "Base", description: "Desc" };
      const result = mergeSettings(base, { siteName: "Updated" });
      expect(result.description).toBe("Desc");
    });

    it("should not include undefined values from update", () => {
      const base = { siteName: "Base", description: "Desc" };
      const result = mergeSettings(base, { siteName: "New", description: undefined });
      expect(result.description).toBe("Desc");
    });
  });
});
