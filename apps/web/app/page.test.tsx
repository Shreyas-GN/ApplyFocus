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
  it("renders hero positioning, primary CTAs, and all core sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Know your value\./i,
      })
    ).toBeInTheDocument();

    const signupLinks = screen.getAllByRole("link", {
      name: /Get started — it's free/i,
    });
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/signup");
    }

    expect(screen.getByRole("link", { name: /See how it works/i })).toHaveAttribute(
      "href",
      "#how-it-works"
    );

    expect(
      screen.getByRole("heading", {
        name: /From profile to prepared application, in one workspace\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /One profile\. A resume tailored for every opportunity\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Know where every application stands\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Questions, answered plainly\./i,
      })
    ).toBeInTheDocument();
  });

  it("supports interactive FAQ accordion", () => {
    render(<HomePage />);

    const secondFaq = screen.getByRole("button", {
      name: /Who is ApplyFocus best suited for\?/i,
    });
    expect(screen.queryByText(/job seekers who want to be intentional/i)).not.toBeInTheDocument();
    fireEvent.click(secondFaq);
    expect(screen.getByText(/job seekers who want to be intentional/i)).toBeInTheDocument();
  });
});
