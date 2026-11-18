import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import HomePage from "./page";

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  }
});

describe("Landing HomePage", () => {
  it("renders the hero, one primary CTA and all core sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Know if you fit\s+before you apply/i })
    ).toBeInTheDocument();

    const signupLinks = screen.getAllByRole("link", { name: /Create your free profile/i });
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/signup");
    }

    for (const name of [
      /The usual job search is frustrating, for good reason/i,
      /Fewer, better applications/i,
      /From profile to prepared application in three steps/i,
      /Better decisions, not more applications/i,
      /Questions, answered plainly/i,
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("includes a skip link, a main landmark and the tagline reveal words", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /Skip to content/i })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-word]").length).toBeGreaterThanOrEqual(10);
  });

  it("has no dead links", () => {
    render(<HomePage />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });

  it("supports interactive FAQ accordion", () => {
    render(<HomePage />);

    const secondFaq = screen.getByRole("button", {
      name: /Who is ApplyFocus best suited for\?/i,
    });
    expect(secondFaq).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/job seekers who want to be intentional/i)).not.toBeInTheDocument();
    fireEvent.click(secondFaq);
    expect(secondFaq).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/job seekers who want to be intentional/i)).toBeInTheDocument();
  });
});
