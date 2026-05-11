"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatBRL, parseBRL } from "@/shared/format/money";

type MoneyInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "defaultValue" | "type"
> & {
  value: string | number;
  onValueChange: (value: string) => void;
  className?: string;
};

export function MoneyInput({
  value,
  onValueChange,
  className,
  onBlur,
  onFocus,
  ...rest
}: MoneyInputProps) {
  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const numericValue = typeof value === "number" ? value : Number(value || 0);
  const display = focused ? draft : formatBRL(numericValue);

  return (
    <Input
      {...rest}
      inputMode="decimal"
      className={cn(className)}
      value={display}
      onFocus={(e) => {
        setFocused(true);
        const raw = Number.isFinite(numericValue) && numericValue !== 0
          ? numericValue.toFixed(2).replace(".", ",")
          : "";
        setDraft(raw);
        onFocus?.(e);
      }}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
      }}
      onBlur={(e) => {
        setFocused(false);
        const parsed = parseBRL(draft);
        onValueChange(parsed.toFixed(2));
        onBlur?.(e);
      }}
    />
  );
}
