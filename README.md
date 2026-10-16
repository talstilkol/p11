> **ARCHIVED 2026-10-16** — homework 11 (currency converter). Finished for its purpose; kept read-only as a course exercise, not a portfolio piece.

# p11 — מחשבון המרת מטבע (תרגיל 11)

Homework 11: a one-page Hebrew/RTL currency converter. Vanilla HTML/CSS/JS, no build step.

- `index.html` — amount input, from/to selects (9 currencies), convert button, result.
- `script.js` — fetches `https://api.frankfurter.dev/v1/latest` and formats the result with `Intl.NumberFormat`.
- `mystyle.css` — centred card layout.

Rates come from [Frankfurter](https://frankfurter.dev) (daily ECB reference rates — not real-time), and the result shows the rate date.
