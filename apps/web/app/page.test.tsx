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
        name: /Your next role starts with knowing yourself\./i,
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
      "#features"
    );

    expect(
      screen.getByRole("heading", {
        name: /A complete career workspace\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /One profile\. A resume tailored to every opportunity\./i,
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
      name: /Who is ApplyPilot for\?/i,
    });
    expect(screen.queryByText(/designed for job seekers at different career stages/i)).not.toBeInTheDocument();
    fireEvent.click(secondFaq);
    expect(screen.getByText(/designed for job seekers at different career stages/i)).toBeInTheDocument();
  });
});
