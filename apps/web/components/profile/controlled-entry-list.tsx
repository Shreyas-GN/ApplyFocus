"use client";

import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import type { FieldConfig, ItemValues } from "./repeatable-section";

const LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface ControlledEntry {
  values: ItemValues;
  source: "user" | "ai";
  confidence: number | null;
}

interface ControlledEntryListProps {
  fields: FieldConfig[];
  items: ControlledEntry[];
  onChange: (items: ControlledEntry[]) => void;
  emptyLabel: string;
  blankValues: ItemValues;
}

// Parsing-review counterpart to RepeatableSection: purely controlled (no
// API call of its own) because the review page saves everything — personal
// info plus every section — in one PATCH to match the backend's single
// resume-parsed-data payload, unlike the profile page's per-section PUT
// endpoints that RepeatableSection calls directly.
export function ControlledEntryList({
  fields,
  items,
  onChange,
  emptyLabel,
  blankValues,
}: ControlledEntryListProps) {
  function updateField(index: number, name: string, value: string | boolean) {
    onChange(
      items.map((item, i) =>
        i === index
          ? { ...item, values: { ...item.values, [name]: value }, source: "user", confidence: 1 }
          : item,
      ),
    );
  }

  function confirmItem(index: number) {
    onChange(
      items.map((item, i) =>
        i === index ? { ...item, source: "user" as const, confidence: 1 } : item,
      ),
    );
  }

  function confirmAllAi() {
    onChange(items.map((item) => ({ ...item, source: "user" as const, confidence: 1 })));
  }

  function addItem() {
    onChange([...items, { values: blankValues, source: "user", confidence: 1 }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const aiCount = items.filter((item) => item.source === "ai").length;

  return (
    <div>
      {aiCount > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <span className="text-xs font-medium text-amber-800">
            {aiCount} AI-extracted {aiCount === 1 ? "entry" : "entries"} awaiting confirmation
          </span>
          <button
            type="button"
            onClick={confirmAllAi}
            className="text-xs font-semibold text-amber-900 hover:underline"
          >
            Confirm all
          </button>
        </div>
      )}
      {items.length === 0 && <p className="mb-3 text-sm text-ui-muted">{emptyLabel}</p>}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const isAi = item.source === "ai";
          return (
            <div
              key={index}
              className={`rounded-lg border p-4 ${isAi ? "border-amber-300 bg-amber-50/40" : "border-ui-border"}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isAi && <Badge>AI-extracted</Badge>}
                  {isAi &&
                    (item.confidence === null || item.confidence < LOW_CONFIDENCE_THRESHOLD) && (
                      <span className="text-xs font-medium text-amber-700">
                        Low confidence — please verify
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  {isAi && (
                    <button
                      type="button"
                      onClick={() => confirmItem(index)}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 hover:opacity-90"
                    >
                      Confirm entry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((field) => {
                  if (field.type === "checkbox") {
                    return (
                      <label key={field.name} className="flex items-center gap-2 text-sm text-ui-ink">
                        <input
                          type="checkbox"
                          checked={Boolean(item.values[field.name])}
                          onChange={(e) => updateField(index, field.name, e.target.checked)}
                        />
                        {field.label}
                      </label>
                    );
                  }
                  if (field.type === "textarea") {
                    return (
                      <div key={field.name} className="sm:col-span-2">
                        <TextAreaField
                          name={`${field.name}-${index}`}
                          label={field.label}
                          value={String(item.values[field.name] ?? "")}
                          onChange={(e) => updateField(index, field.name, e.target.value)}
                          rows={3}
                        />
                      </div>
                    );
                  }
                  return (
                    <TextField
                      key={field.name}
                      name={`${field.name}-${index}`}
                      label={field.label}
                      placeholder={field.placeholder}
                      value={String(item.values[field.name] ?? "")}
                      onChange={(e) => updateField(index, field.name, e.target.value)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <Button variant="secondary" onClick={addItem} className="mt-4">
        + Add
      </Button>
    </div>
  );
}
