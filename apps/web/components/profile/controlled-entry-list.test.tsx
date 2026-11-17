import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ControlledEntryList, type ControlledEntry } from "./controlled-entry-list";
import type { FieldConfig } from "./repeatable-section";

const fields: FieldConfig[] = [
  { name: "name", label: "Skill", type: "text" },
  { name: "category", label: "Category", type: "text" },
];

const blankValues = { name: "", category: "" };

function makeItems(sources: Array<"user" | "ai">): ControlledEntry[] {
  return sources.map((source, i) => ({
    source,
    confidence: source === "ai" ? 0.9 : 1,
    values: { name: `Skill ${i + 1}`, category: "" },
  }));
}

describe("ControlledEntryList — confirmation UX", () => {
  it("shows AI-extracted badge and Confirm entry button for AI items", () => {
    const onChange = vi.fn();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["ai"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    // Both the item badge and the banner contain "AI-extracted"; at least one must exist
    expect(screen.getAllByText(/ai-extracted/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /confirm entry/i })).toBeInTheDocument();
  });

  it("does not show Confirm entry button for user-sourced items", () => {
    const onChange = vi.fn();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["user"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    expect(screen.queryByRole("button", { name: /confirm entry/i })).not.toBeInTheDocument();
  });

  it("shows AI count banner with Confirm all button when AI items exist", () => {
    const onChange = vi.fn();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["ai", "ai", "user"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    expect(screen.getByText(/2 AI-extracted entries awaiting confirmation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm all/i })).toBeInTheDocument();
  });

  it("hides banner when no AI items remain", () => {
    const onChange = vi.fn();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["user", "user"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    expect(screen.queryByText(/awaiting confirmation/i)).not.toBeInTheDocument();
  });

  it("clicking Confirm entry promotes that item to source user", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["ai"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    await user.click(screen.getByRole("button", { name: /confirm entry/i }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ source: "user", confidence: 1 }),
    ]);
  });

  it("clicking Confirm all promotes every item to source user", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["ai", "ai", "user"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    await user.click(screen.getByRole("button", { name: /confirm all/i }));

    const result = onChange.mock.calls[0][0] as ControlledEntry[];
    expect(result.every((item) => item.source === "user")).toBe(true);
    expect(result).toHaveLength(3);
  });

  it("editing a field promotes that item to source user without touching others", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const items = makeItems(["ai", "ai"]);
    render(
      <ControlledEntryList
        fields={fields}
        items={items}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    const inputs = screen.getAllByRole("textbox", { name: /skill/i });
    await user.clear(inputs[0]);
    await user.type(inputs[0], "Python");

    const result = onChange.mock.calls.at(-1)![0] as ControlledEntry[];
    expect(result[0].source).toBe("user");
    expect(result[1].source).toBe("ai");
  });

  it("AI items remain source ai when no action is taken (no silent promotion)", () => {
    const onChange = vi.fn();
    render(
      <ControlledEntryList
        fields={fields}
        items={makeItems(["ai", "ai"])}
        onChange={onChange}
        emptyLabel="No items"
        blankValues={blankValues}
      />,
    );

    // onChange not called on initial render — items are unmodified
    expect(onChange).not.toHaveBeenCalled();
  });
});
