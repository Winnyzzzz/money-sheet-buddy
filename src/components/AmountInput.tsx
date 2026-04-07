import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function formatWithCommas(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function parseAmount(formatted: string): number {
  return parseInt(formatted.replace(/,/g, ""), 10) || 0;
}

const AmountInput = ({
  value,
  onChange,
  placeholder = "0",
  className,
  autoFocus,
  onBlur,
  onKeyDown,
}: AmountInputProps) => {
  const [display, setDisplay] = useState(() =>
    value > 0 ? value.toLocaleString("en-US") : ""
  );
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setDisplay(value > 0 ? value.toLocaleString("en-US") : "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatWithCommas(raw);
    setDisplay(formatted);
    skipSyncRef.current = true;
    onChange(parseAmount(formatted));
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className={cn("font-mono", className)}
      data-testid="input-amount"
    />
  );
};

export default AmountInput;
