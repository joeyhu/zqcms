import { describe, it, expect } from "bun:test";

describe("FAQ Block Logic", () => {
  interface FAQItem {
    question: string;
    answer: string;
  }

  function validateFAQItems(items: FAQItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(items)) {
      return { valid: false, errors: ["Items must be an array"] };
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.question || item.question.trim().length === 0) {
        errors.push(`Item ${i}: question is required`);
      }
      if (!item.answer || item.answer.trim().length === 0) {
        errors.push(`Item ${i}: answer is required`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  function searchFAQ(items: FAQItem[], query: string): FAQItem[] {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }

  describe("Validation", () => {
    it("should validate correct FAQ items", () => {
      const items = [
        { question: "What is this?", answer: "This is a test." },
        { question: "How to use?", answer: "Just use it." },
      ];
      expect(validateFAQItems(items).valid).toBe(true);
    });

    it("should reject empty question", () => {
      const items = [{ question: "", answer: "Some answer" }];
      const result = validateFAQItems(items);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject empty answer", () => {
      const items = [{ question: "Q?", answer: "" }];
      const result = validateFAQItems(items);
      expect(result.valid).toBe(false);
    });

    it("should reject non-array input", () => {
      const result = validateFAQItems(null as unknown as FAQItem[]);
      expect(result.valid).toBe(false);
    });

    it("should validate empty array as valid", () => {
      expect(validateFAQItems([]).valid).toBe(true);
    });
  });

  describe("Search", () => {
    const items: FAQItem[] = [
      { question: "How to install?", answer: "Run npm install." },
      { question: "What is the price?", answer: "It's free." },
      { question: "How to configure?", answer: "Edit config file." },
    ];

    it("should find matching questions", () => {
      const result = searchFAQ(items, "install");
      expect(result).toHaveLength(1);
      expect(result[0].question).toContain("install");
    });

    it("should find matching answers", () => {
      const result = searchFAQ(items, "free");
      expect(result).toHaveLength(1);
    });

    it("should be case-insensitive", () => {
      expect(searchFAQ(items, "HOW TO")).toHaveLength(2);
    });

    it("should return all items for empty query", () => {
      expect(searchFAQ(items, "")).toHaveLength(3);
    });

    it("should return empty for no matches", () => {
      expect(searchFAQ(items, "nonexistent")).toEqual([]);
    });
  });
});
