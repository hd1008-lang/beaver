export const stylesCssTemplate = (): string =>
`@import "tailwindcss";

@theme {
  /* Brand */
  --color-primary:       oklch(0.55 0.22 265);
  --color-primary-fg:    oklch(0.97 0.01 265);

  /* Surfaces (dark-first) */
  --color-surface:       oklch(0.11 0.015 265);
  --color-surface-muted: oklch(0.16 0.012 265);
  --color-surface-high:  oklch(0.21 0.010 265);

  /* Text */
  --color-text:          oklch(0.97 0.000 0);
  --color-text-muted:    oklch(0.62 0.010 265);
  --color-text-subtle:   oklch(0.42 0.010 265);

  /* Border */
  --color-border:        oklch(0.28 0.010 265);
}
`;
