"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import { ChangeEvent } from "react";

import { DEFAULT_BRAND_COLOR } from "@/lib/branding";

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim());
}

function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed.startsWith("#")) return `#${trimmed}`.toLowerCase();
  return trimmed.toLowerCase();
}

function toPickerValue(hex: string, fallback: string): string {
  const candidate = hex.trim();
  if (isValidHex(candidate)) return candidate;
  return fallback;
}

type BrandColorPickerProps = {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  fallbackColor?: string;
  allowEmpty?: boolean;
};

export default function BrandColorPicker({
  label = "Brand color",
  helperText,
  value,
  onChange,
  disabled = false,
  fallbackColor = DEFAULT_BRAND_COLOR,
  allowEmpty = false,
}: BrandColorPickerProps) {
  const hasValue = value.trim() !== "" && isValidHex(value);
  const displayColor = hasValue ? value : fallbackColor;
  const pickerValue = toPickerValue(value, fallbackColor);
  const hexLabel = hasValue ? normalizeHex(value) : allowEmpty ? "Not set" : normalizeHex(fallbackColor);

  function handleColorChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(normalizeHex(event.target.value));
  }

  return (
    <Box>
      {label && (
        <InputLabel
          shrink
          sx={{ position: "relative", transform: "none", mb: 0.75, fontWeight: 600 }}
        >
          {label}
        </InputLabel>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box
          component="label"
          sx={{
            position: "relative",
            display: "inline-flex",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: displayColor,
              border: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
              "@media (pointer: coarse)": {
                width: 52,
                height: 52,
              },
            }}
          />
          <Box
            component="input"
            type="color"
            value={pickerValue}
            onChange={handleColorChange}
            disabled={disabled}
            aria-label={label}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              border: "none",
              p: 0,
            }}
          />
        </Box>
        <Typography
          variant="body2"
          component="span"
          sx={{
            fontFamily: "monospace",
            color: hasValue || !allowEmpty ? "text.primary" : "text.secondary",
          }}
          aria-live="polite"
        >
          {hexLabel}
        </Typography>
        {allowEmpty && hasValue && (
          <Button size="small" onClick={() => onChange("")} disabled={disabled}>
            Clear
          </Button>
        )}
      </Box>
      {helperText && <FormHelperText sx={{ mx: 0, mt: 0.75 }}>{helperText}</FormHelperText>}
    </Box>
  );
}
