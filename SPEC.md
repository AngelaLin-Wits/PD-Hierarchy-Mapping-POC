# PD Hierarchy Mapping POC — Functional Specification

## 1. Purpose
Browser POC for reviewing Test Excel Change Commands, converting hierarchy data, confirming mapping and exporting the result. Online PD Hierarchy Baseline is a persistent validation reference.

## 2. Data roles
1. **Online PD Hierarchy (Baseline)** — current production hierarchy. It is never used to invent Change Commands. It is used only to validate Test Change Commands against hierarchy rules, including whether a Target already exists at the same hierarchy level.
2. **Original Data** — Test Excel exactly as uploaded; read-only.
3. **Converted Data** — starts from Test Original Data and is transformed by User-accepted Change Commands plus explicit manual edits.

Converted Data is above Original Data on the same page.

## 3. Authoritative workflow
1. Upload Baseline and Test Excel.
2. Mapping Review reads nonblank **Change Command from Test Excel**. Blank Test Change Command does not create an inferred command merely from Baseline/Test differences.
3. Parse the complete set of Test Change Commands first.
4. Perform **Batch Validation**. Baseline is consulted only for validation, not command inference.
5. Apply Case 1 / Case 2 / Case 3 rules below.
6. User resolves Required Action / Needs Review, then Accepts, Edits, or selects No Change.
7. An accepted command is immediately reflected in Converted Data so User can compare the result before final confirmation.
8. User may manually edit Converted Data. A newly entered hierarchy value may generate an Add Change Command only after explicit User confirmation.
9. Confirm Mapping only when all review items are resolved.
10. Generate Mapping Change Log and export using the Test workbook as template.

**Core conversion rule:** `Test Original Data + Accepted final Change Commands + explicit manual edits = Converted Data`.

## 4. Baseline boundary
Baseline MUST NOT generate Suggested Change Commands from hierarchy differences, create Mapping Review rows merely because Test Change Command is blank, directly generate Converted Data, or replace Test Excel as the source of initial mapping intent.

Baseline MAY determine whether a command Target already exists at the same hierarchy level, validate Rename versus Merge semantics, and identify Case 3 Multiple Sources → Same New Target.

## 5. Rename / Merge Batch Validation
Evaluation is performed over the complete Test Change Command set, not sequentially by Excel row.

### Case 1 — Single Source → New Target
If one Source maps to a Target that does not exist in Baseline at the same level, expected action is **Rename**.

### Case 2 — Target already exists
If Target already exists in Baseline at the same level, expected action is **Merge**. Multiple Sources to an existing Target are all Merge.

### Case 3 — Multiple Sources → Same New Target
If multiple distinct Sources map to the same Target and that Target does not exist in Baseline, status becomes **Required Action** and User must select a **Primary Source**.

Case 3 grouping key is **Sheet / Hierarchy Type + Hierarchy Level + Target**. Each Case 3 Target group is independent. Therefore, if four Rename commands contain two Sources mapping to `Panel PC-Angela` and the other two each map to different new Targets, only the two commands targeting `Panel PC-Angela` form a Case 3 group. The two single-source new Targets remain Case 1 and require no Primary Source.

For each Case 3 group, Set Primary opens one dropdown. Dropdown options are restricted to the Sources in that group. Before a Source is selected, no Rename/Merge conclusion is generated and Converted Data is unchanged. After selection, Primary Source becomes Rename and all other Sources in that group become Merge. Selection itself is not acceptance: the resulting commands remain Pending Review until User Accepts them.

## 6. Mapping Review
Display Sheet, Row, Level, Source, Target, Change Command, Command Check / Parsed Result, Status and Action.

Statuses: **Pending Review**, **Valid**, **Needs Review**, **Required Action**, **No Change**.

Actions: **Accept**, **Edit**, **No Change**, and **Set Primary** for Case 3.

Accept immediately applies the accepted final command to Converted Data. Confirm Mapping is the final batch confirmation; it does not delay preview of accepted transformations.

Confirm Mapping requires Pending Review = 0, Needs Review = 0, Required Action = 0.

## 7. Manual editing in Converted Data
Converted Data is editable and manual edits are recorded separately in the audit trail.

When User changes a BG / PG / MD / PD / PDL cell to a hierarchy value that does not exist in the Original Test data at that level, the POC prompts the User before creating a Change Command. Example:

`New PDL detected: "PDL Angela"`

Proposed command:

`Add PDL "PDL Angela"`

If User confirms, the Add command is inserted into Mapping Review as **Pending Review**. It still requires Accept before it becomes a confirmed mapping item. If User declines, no Change Command is created; the manual Converted Data edit remains an explicit manual edit/audit event.

Manual editing must never silently create a Change Command without User confirmation.

## 8. Supported actions and hierarchy semantics
Supported actions: Add, Rename, Merge, Face Out / Phase Out, and special Delete MD. There is no separate Move action.

Merge is level-aware and subtree-aware. Parent-level Merge carries applicable descendants. PDL is never physically deleted. PD and parent entities retain identity/history and may become inactive. Delete MD is a special transformation and must not cascade physical deletion.

A parenthesized PDL such as `(PDL ABC)` means Upcoming Phase Out annotation. Preserve it; annotation alone does not create Mapping Change Log or actual DB phase-out state.

## 9. Planned Go-Live Date and descriptions
Provide Planned Go-Live Date. Maintain Change Command for processing and editable Change Description for human-readable explanation.

## 10. Logs
Formal Mapping Change Log is generated only after Confirm Mapping from accepted final commands. No Change and Upcoming Phase Out annotation-only items are excluded. Accepted commands generated from confirmed Converted Data manual additions are included, with evidence identifying their manual-edit origin.

## 11. Standard / Virtual worksheets
Preserve Test workbook worksheet structure. Standard and Virtual remain separate sheets. Do not invent a visible HierarchyType column unless required by the workbook.

## 12. Ignored columns
For the current POC, **PD Head, MD Head, PG Head, Remark** are not displayed in Original Data or Converted Data and do not participate in Mapping Review or Case 1/2/3 processing. They are not physically removed from the workbook; export retains their original structure/values unless later requirements explicitly change this rule.

## 13. Export and formatting
Use original Test Excel workbook as export template and write Converted Data values back into corresponding sheets. Preserve worksheet order/names, fills, borders, fonts, alignment, column widths, row heights, merged cells, number/date formats and Upcoming Phase Out notation as faithfully as the browser Excel library permits. Mapping Change Log may be appended as a system-formatted worksheet.

## 14. UI
Use EAI visual style. Baseline/Test upload remain separate. Keep Planned Go-Live Date, Reset Test, Replace/Clear Baseline. Converted Data is above Original Data. BG/MD/PD do not wrap. Original is read-only; Converted is editable.

## 15. Persistence and scope
Baseline survives Test uploads/reset and browser refresh where available. Only explicit replace/clear changes it. Formal DB writes are out of POC scope.
