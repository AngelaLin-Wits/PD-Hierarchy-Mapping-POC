# PD Hierarchy Mapping POC — Functional Specification

## 1. Purpose
Browser POC for reviewing Test Excel Change Commands, converting hierarchy data, confirming mapping and exporting the result. Online PD Hierarchy Baseline is a persistent validation reference.

## 2. Data roles
1. **Online PD Hierarchy (Baseline)** — current production hierarchy. It is never used to invent Change Commands. It is used only to validate Test Change Commands against hierarchy rules, including whether a Target already exists at the same hierarchy level.
2. **Original Data** — Test Excel exactly as uploaded; read-only.
3. **Converted Data** — starts from Test Original Data and is transformed only by final User-accepted Change Commands plus explicit manual edits.

Converted Data is above Original Data on the same page.

## 3. Authoritative workflow
1. Upload Baseline and Test Excel.
2. Mapping Review reads nonblank **Change Command from Test Excel**. Blank Change Command does not create an inferred command.
3. Parse the complete set of Test Change Commands first.
4. Perform **Batch Validation** of those commands. Baseline may be consulted only for validation, not command inference.
5. Apply Case 1 / Case 2 / Case 3 rules below.
6. User resolves Required Action / Needs Review, then Accepts, Edits, or selects No Change.
7. Rebuild Converted Data from a fresh copy of Test Original Data using only accepted final commands.
8. Confirm Mapping only when all review items are resolved.
9. Generate Mapping Change Log and export using the Test workbook as template.

**Core conversion rule:** `Test Original Data + Accepted final Change Commands = Converted Data`.

**Core validation rule:** `Test Change Commands + Baseline validation reference + Batch Rules = Mapping Review status`.

## 4. Baseline boundary
Baseline MUST NOT:
- generate Suggested Change Commands from hierarchy differences;
- create Mapping Review rows when Test Change Command is blank;
- directly generate Converted Data;
- replace the Test Excel as the source of mapping intent.

Baseline MAY be used to:
- determine whether a command Target already exists at the same hierarchy level;
- validate Rename versus Merge semantics;
- identify Case 3 Multiple Sources → Same New Target.

## 5. Rename / Merge Batch Validation
Evaluation is performed over the complete Test Change Command set, not sequentially by Excel row.

### Case 1 — Single Source → New Target
If one Source maps to a Target that does not exist in Baseline at the same level, expected action is **Rename**.

### Case 2 — Target already exists
If Target already exists in Baseline at the same level, expected action is **Merge**. Multiple Sources to an existing Target are all Merge.

### Case 3 — Multiple Sources → Same New Target
If multiple distinct Sources map to the same Target and that Target does not exist in Baseline, the system must not accept multiple independent Rename commands.

Status becomes **Required Action** and User must select a **Primary Source**.

Example:
- `Panel PC → Panel PC - Angela`
- `Industrial Monitor → Panel PC - Angela`
- `Panel PC - Angela` absent from Baseline

If Primary Source = `Panel PC`:
- `Rename PD "Panel PC" to "Panel PC - Angela"`
- `Merge PD "Industrial Monitor" into "Panel PC - Angela"`

If Primary Source = `Industrial Monitor`, the actions are reversed.

Primary Source affects action semantics/logging, while final hierarchy target remains the same.

## 6. Mapping Review
Display Sheet, Row, Level, Source, Target, Change Command, Command Check / Parsed Result, Status and Action.

Statuses:
- **Pending Review** — recognized and rule-valid command waiting for User decision.
- **Valid** — accepted command.
- **Needs Review** — invalid syntax or command conflicts with Case 1/2 rules.
- **Required Action** — Case 3 requires Primary Source selection.
- **No Change** — User explicitly chooses not to execute the command.

Actions:
- **Accept** — execute the final command.
- **Edit** — modify command, then run Batch Validation again.
- **No Change** — do not execute this command; does not enter formal Mapping Change Log.
- **Set Primary** — for Case 3, choose the Primary Source. System converts that group to one Rename plus remaining Merge commands; each final command still requires review/acceptance.

Confirm Mapping requires Pending Review = 0, Needs Review = 0, Required Action = 0.

## 7. Supported actions and hierarchy semantics
Supported actions: Add, Rename, Merge, Face Out / Phase Out, and special Delete MD. There is no separate Move action.

Merge is level-aware and subtree-aware. Parent-level Merge carries applicable descendants. PDL is never physically deleted. PD and parent entities retain identity/history and may become inactive. Delete MD is a special transformation and must not cascade physical deletion.

A parenthesized PDL such as `(PDL ABC)` means Upcoming Phase Out annotation. Preserve it; annotation alone does not create Mapping Change Log or actual DB phase-out state.

## 8. Planned Go-Live Date and descriptions
Provide Planned Go-Live Date. Maintain Change Command for processing and editable Change Description for human-readable explanation.

## 9. Manual editing and logs
Converted Data is editable. Manual edits are separate audit events. Formal Mapping Change Log is generated only after Confirm Mapping from accepted final commands; No Change and Upcoming Phase Out annotation-only items are excluded.

## 10. Standard / Virtual worksheets
Preserve Test workbook worksheet structure. Standard and Virtual remain separate sheets. Do not invent a visible HierarchyType column unless required by the workbook.

## 11. Export and formatting
Use original Test Excel workbook as export template and write Converted Data values back into corresponding sheets. Preserve worksheet order/names, fills, borders, fonts, alignment, column widths, row heights, merged cells, number/date formats and Upcoming Phase Out notation as faithfully as the browser Excel library permits. Mapping Change Log may be appended as a system-formatted worksheet.

## 12. UI
Use EAI visual style. Baseline/Test upload remain separate. Keep Planned Go-Live Date, Reset Test, Replace/Clear Baseline. Converted Data is above Original Data. BG/MD/PD do not wrap. Original is read-only; Converted is editable.

## 13. Persistence and scope
Baseline survives Test uploads/reset and browser refresh where available. Only explicit replace/clear changes it. Formal DB writes are out of POC scope.
