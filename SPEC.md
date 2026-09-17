# PD Hierarchy Mapping POC — Functional Specification

## 1. Purpose
Build a browser-based POC for uploading a Test PD Hierarchy Excel, reviewing its Change Commands, producing editable Converted Data, confirming mapping, and exporting the converted workbook. An Online PD Hierarchy Baseline is maintained as a separate persistent dataset, but it does **not** drive Mapping Review or Converted Data generation.

## 2. Data roles
The tool maintains three distinct datasets:

1. **Online PD Hierarchy (Baseline)** — separately uploaded current production hierarchy. It is persistent and is replaced/cleared only by an explicit user action. Test upload/reset must never clear it. **Baseline is not used to infer, validate, suggest, or execute Change Commands for the Test mapping flow.**
2. **Original Data** — the current Test Excel exactly as uploaded; read-only.
3. **Converted Data** — starts as a copy of Original Data and is transformed only by Change Commands from the Test Excel that the user accepts, plus explicit manual edits made in Converted Data.

Converted Data is displayed above Original Data on the same page for direct comparison.

## 3. Authoritative Mapping workflow
1. Upload Baseline if required for the separate baseline dataset. Baseline is not a prerequisite for Test Mapping Review.
2. Upload Test PD Hierarchy Excel.
3. Read **Change Command from the Test Excel itself**.
4. Rows with blank Change Command do not create Mapping Review items and do not receive an automatically inferred command.
5. Parse each nonblank Change Command and show it in Mapping Review.
6. User reviews each command and chooses **Accept**, **Edit**, or **No Change**.
7. Accepted commands are executed against a fresh copy of the **Test Original Data** to build Converted Data.
8. Editing a command causes it to be parsed/reviewed again before it can be accepted.
9. No Change means the Test Excel command is explicitly not executed for this conversion.
10. Converted Data remains editable for manual corrections.
11. Confirm Mapping is enabled only when every nonblank Test Change Command has a resolved review result and there are no Pending Review / Needs Review items.
12. Confirm Mapping produces the formal Mapping Change Log from accepted Test Change Commands.
13. Export Converted Data using the original Test workbook as the template.

**Core rule:** `Test Original Data + Accepted Test Change Commands = Converted Data`.

## 4. Mapping Review
Mapping Review must **not compare Test hierarchy differences with Baseline to generate Suggested Change Commands**.

For each nonblank Test Change Command, display enough information to review the command, including:
- source worksheet / row
- hierarchy level
- source
- Change Command
- parsed command/result
- review status
- actions

Review outcomes:
- **Accept** — execute the Test Excel Change Command.
- **Edit** — user changes the command; the edited command must pass command parsing/validation and then be accepted.
- **No Change** — explicitly do not execute this command. It is considered reviewed and does not block Confirm Mapping.

Statuses:
- **Pending Review** — syntactically recognized command waiting for user decision.
- **Valid** — accepted recognized command.
- **Needs Review** — unrecognized/invalid command requiring correction or No Change.
- **No Change** — explicitly rejected/not executed.

`Confirm Mapping` is enabled when `Pending Review = 0` and `Needs Review = 0`. A Test Excel with no Change Commands may be confirmed without Mapping Review items.

## 5. Change Command behavior
Supported action model:
- **Add**
- **Rename**
- **Merge**
- **Face Out / Phase Out**
- special **Delete MD** transformation

There is no separate Move action. Hierarchy reassignment is represented by the applicable Merge/reassignment command.

Merge is level-aware and subtree-aware. Parent-level Merge semantics carry the applicable descendant hierarchy. The production implementation must execute hierarchy relationship changes according to the command semantics rather than relying on Baseline inference.

## 6. Lifecycle rules
Physical Delete is prohibited for normal PG/PD/PDL hierarchy processing.

- PDL is never physically deleted; no longer used PDL follows Phase Out lifecycle.
- PD and parent hierarchy entities retain identity/history and may become inactive/disabled.
- MD is the special business-level Delete case. `Delete MD` removes/clears the MD representation without cascading physical deletion of PD/PDL descendants.

A PDL shown in parentheses, e.g. `(PDL ABC)`, means **Upcoming Phase Out**. It remains an annotation and must be preserved in Converted Data/export. The annotation alone must not create a Mapping Change Log entry or set actual DB phase-out status.

## 7. Planned Go-Live Date and descriptions
Provide **Planned Go-Live Date**.

Maintain:
- **Change Command** — structured action used for processing.
- **Change Description** — human-readable description; may default from the command and is editable.

## 8. Manual editing and logs
Converted Data is editable. Manual changes should be captured as separate audit events with before/after values and source `Manual Edit`.

Formal Mapping Change Log is generated only after Confirm Mapping. It contains accepted mapping commands; No Change items are excluded. Upcoming Phase Out annotation alone is excluded.

## 9. Standard / Virtual worksheets
Preserve the Test workbook's worksheet structure. Standard and Virtual hierarchy worksheets remain separate. Do not merge them during conversion or export. Do not invent a visible HierarchyType column unless the workbook requires it.

## 10. Export and formatting
Export uses the **original Test Excel workbook as the template** and writes Converted Data values back into the corresponding worksheets.

The implementation should preserve, as faithfully as the browser Excel library permits:
- worksheet names and order
- cell formatting / fill colors
- borders
- fonts
- alignment
- column widths and row heights
- merged cells
- number/date formats
- Standard / Virtual sheet separation
- Upcoming Phase Out parentheses

Mapping Change Log may be appended as a new worksheet with system-defined formatting.

The system should modify only values required by mapping/manual editing and should not intentionally alter unrelated workbook formatting. The current browser POC uses SheetJS Community Edition, so complex Excel style round-tripping may have library limitations; production implementation should use an Excel library/approach that guarantees the required formatting fidelity.

## 11. UI
- EAI visual style.
- Baseline upload and Test upload remain separate.
- Planned Go-Live Date, Reset Test, Replace/Clear Baseline remain available.
- Converted Data appears above Original Data; they are not separate page tabs.
- Worksheet tabs inside each section may be used for actual workbook sheets such as Standard / Virtual.
- BG, MD, and PD cells do not wrap; horizontal scrolling is used when necessary.
- Original Data is read-only.
- Converted Data is editable.

## 12. Baseline persistence
Baseline survives Test uploads, Test reset, and page refresh/reopen where browser persistence is available. Only explicit Replace/Clear Baseline or a new Baseline upload changes it.

**Important separation:** Baseline persistence does not imply Baseline participation in Mapping Review. The Test mapping flow is driven by the Test Excel's own Change Commands.

## 13. Scope
This POC validates browser-side command review, conversion, editing, confirmation, logging, and export. Formal database writes are out of scope. Database schema is documented separately for future integration.
