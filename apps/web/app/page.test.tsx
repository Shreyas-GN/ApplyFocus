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

    // h1 says "Find better jobs." with "Apply smarter." in a child span
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Find better jobs/i,
      })
    ).toBeInTheDocument();

    // Nav (desktop + mobile) and hero each render "Get started — it's free" links
    const signupLinks = screen.getAllByRole("link", {
      name: /Get started/i,
    });
    expect(signupLinks.length).toBeGreaterThanOrEqual(2);
    for (const link of signupLinks) {
      expect(link).toHaveAttribute("href", "/signup");
    }

    // Hero "See how it works" link points to the how-it-works anchor
    expect(screen.getByRole("link", { name: /See how it works/i })).toHaveAttribute(
      "href",
      "#how-it-works"
    );

    expect(
      screen.getByRole("heading", {
        name: /A clearer way to move your job search forward/i,
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

    const faqButton = screen.getByRole("button", {
      name: /Who is ApplyPilot best suited for\?/i,
    });
    expect(screen.queryByText(/designed for job seekers who want to be intentional/i)).not.toBeInTheDocument();
    fireEvent.click(faqButton);
    expect(screen.getByText(/designed for job seekers who want to be intentional/i)).toBeInTheDocument();
  });
});
