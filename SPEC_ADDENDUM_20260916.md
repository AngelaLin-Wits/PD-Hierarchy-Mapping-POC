# PD Hierarchy Mapping POC — Specification Addendum (2026-09-16)

This addendum is normative and supplements `SPEC.md` for the current POC.

## 1. Mapping Review decision model
A system-generated Suggested Change Command is a recommendation and MUST NOT be treated as user confirmation.

Each Mapping Review item must end in one of these user-resolved outcomes:
- **Valid** — user accepted the Suggested Change Command, or an Excel/user-entered Change Command matches the deterministic Mapping Rule.
- **No Change** — user explicitly rejects the suggested mapping change. This item is considered reviewed, does not block Confirm Mapping, and MUST NOT be written to the formal Mapping Change Log. The review decision remains in audit history.
- **Needs Review** — user-entered/edited Change Command conflicts with the deterministic Mapping Rule and must be corrected, accepted, or changed to No Change.
- **Required Action** — mandatory information is missing, e.g. Primary Source for Multiple Sources → New Target.
- **Pending Review** — a deterministic system suggestion exists but the user has not yet made a decision.

### Confirm Mapping enable rule
`Confirm Mapping` is enabled only when:
- Pending Review = 0
- Needs Review = 0
- Required Action = 0

`No Change` does not block confirmation.

A user is NOT required to Accept every suggestion. A valid batch may contain, for example, accepted suggestions, validated manual edits, and explicit No Change decisions.

`Accept All Suggestions` applies only to reviewable deterministic suggestions; it must not bypass Required Action such as Primary Source selection.

## 2. Review audit
Accept, Edit, and No Change decisions should be retained as review/audit events. Manual edits in Converted Data should record before/after values separately from the formal Mapping Change Log.

The formal Mapping Change Log is produced only after Confirm Mapping and excludes No Change decisions and Upcoming Phase Out annotations.

## 3. Converted / Original display
Converted Data remains above Original Data on the same page. Converted Data is editable; Original Data is read-only.

For hierarchy tables, BG, MD, and PD values must display on one line without wrapping. Horizontal scrolling is preferred when necessary. Standard / Virtual worksheet tabs may remain inside each section when the workbook contains multiple hierarchy worksheets.

## 4. Export fidelity
Export MUST use the uploaded Test Excel workbook as the output template rather than rebuilding all hierarchy worksheets from scratch.

The export process should change only required hierarchy cell values and preserve original workbook presentation as faithfully as the browser Excel library allows, including:
- worksheet names and order
- Standard / Virtual separation
- cell fill/background colors
- borders
- fonts
- alignment
- column widths
- row heights
- merged cells
- number/date formats
- other unrelated formatting
- Upcoming Phase Out parentheses/notation

The Mapping Change Log may be added as a new worksheet using system-defined formatting.

POC limitation: browser-side SheetJS Community Edition may not round-trip every advanced Excel formatting feature perfectly. The implementation therefore uses the original Test workbook as the export base and preserves existing cell objects/styles where supported, instead of regenerating hierarchy sheets from plain arrays.
