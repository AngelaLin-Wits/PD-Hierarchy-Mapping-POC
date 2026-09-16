# PD Hierarchy Mapping POC — Functional Specification

## 1. Purpose
Build a browser-based POC for uploading, converting, reviewing, validating, confirming, and exporting PD Hierarchy Excel data. The POC must preserve the current online hierarchy as an immutable comparison baseline while allowing users to repeatedly upload test Excel files.

## 2. Data roles
The tool maintains three distinct datasets:

1. **Online PD Hierarchy (Baseline)** — current production hierarchy. Upload separately and display the uploaded filename. Test uploads, conversion, editing, and reset of test data must never delete this baseline. It is replaced only when the user explicitly uploads another Online PD Hierarchy file.
2. **Original Data** — the current test Excel exactly as uploaded; read-only and used for comparison.
3. **Converted Data** — the transformed hierarchy after applying commands/rules; editable by the user. Manual changes must immediately rebuild/reorganize hierarchy relationships where applicable.

The page should show Converted Data and Original Data in the same page for easy comparison.

## 3. Upload / workflow
1. Upload Online PD Hierarchy baseline.
2. Upload a test PD Hierarchy Excel. Test Excel can be uploaded repeatedly.
3. Parse and convert the complete workbook.
4. Show Original Data and Converted Data.
5. Allow manual review/editing of Converted Data.
6. Validate declared Excel actions against mapping rules and Online Baseline.
7. Resolve warnings and required actions.
8. User clicks **Confirm Mapping**.
9. Compare final Converted Data against the immutable Online Baseline.
10. Generate Mapping Change Log / Confirm Mapping output.
11. Export converted Excel while preserving required workbook structure.

Confirm Mapping must be disabled while unresolved `Needs Review` or `Required Action` records exist.

## 4. Standard and Virtual hierarchy
- The source workbook keeps virtual hierarchy in separate worksheet(s); export must also keep virtual hierarchy in separate worksheet(s).
- Do not merge Standard and Virtual hierarchy into one Excel sheet.
- Internally tag imported rows with `HierarchyType = Standard | Virtual` based on their source worksheet/configuration.
- Standard data compares only with Standard data; Virtual compares only with Virtual.
- Do not determine Virtual merely by worksheet ordinal. Use configured/recognized sheet names.
- Database currently provides `Virtual` at PG and MD levels. Existing compatibility behavior must be preserved.
- The POC does not need to add a visible `HierarchyType` Excel column unless the existing workbook specification requires it.

## 5. Upcoming Phase Out PDL
- A PDL shown in parentheses, e.g. `(PDL ABC)`, means **Upcoming Phase Out**, not already phased out.
- It remains an active/effective PDL for hierarchy mapping and comparison.
- Preserve the marker faithfully in Converted Data and exported Excel.
- Upcoming Phase Out is display/annotation only and must **not generate Mapping Change Log or status-change log entries**.
- Existing DB `IsPhaseOut`/`PhaseOutDate` represents actual Phase Out and must not be set merely because a PDL is marked Upcoming Phase Out.

## 6. Effective date and descriptions
Provide an input for **Planned Go-Live / Effective Date**.

Maintain two description concepts:
- **Machine Action / Change Command** — structured/fixed action semantics for system processing.
- **User Description** — user-readable description, defaulted from the action/command and freely editable.

Example user-facing description:
`2026/10/01 new PDL 123 to PD AAA`

## 7. Supported hierarchy actions
The POC action model is intentionally small:
- **Add**
- **Rename**
- **Merge**
- **Face Out**

**Move is NOT a separate action.** Hierarchy relocation/reassignment is handled by the level-aware Merge operation.

Upcoming Phase Out is an annotation only, not an action.

### Merge is level-aware and subtree-aware
Every Merge command must identify the hierarchy level being operated on. The operation is completed at that level, and the complete descendant subtree follows that node as applicable.

Examples:
- **PG-level Merge**: merging `IDS` into `IPMG` causes the hierarchy under IDS (MD → PD → PDL) to be reassigned/combined under IPMG as part of the PG-level operation.
- **MD-level Merge**: merging `MD-A` into `MD-B` carries the descendant PD → PDL hierarchy with it.
- **PD-level Merge**: merging `PD-A` into `PD-B` carries descendant PDLs with it.
- **PDL-level Merge**: affects the PDL-level entity/mapping only; there is no lower subtree.

The system must not require users to separately issue child-level Move commands when a parent-level Merge already determines the descendant relocation.

If an entity keeps the same name but is reassigned to a different parent, the internal implementation may use the same relationship-reassignment mechanics as Merge. The user-facing description should clearly state the reassignment (for example, `PD-X reassigned from MD-A to MD-B`) rather than introducing a separate Move action.

## 8. Rename / Merge — mandatory batch evaluation
Rename/Merge determination MUST use **Batch Evaluation**, never sequential row-by-row state mutation.

Before conversion, create an immutable snapshot of the Online PD Hierarchy. Parse the complete set of Excel change commands first, group them by `Hierarchy Level + Target`, evaluate rules, then generate Converted Data.

Target existence is always determined against the Online Baseline Snapshot at the same hierarchy level. It must never be determined from a Converted Data state modified by an earlier Excel row. Therefore changing Excel row order must not change the result.

### Case 1 — Single Source → New Target
If Target does not exist in Online Baseline:
- `IPSG → IPMG`
- Baseline: IPSG exists; IPMG does not exist
- Result: `Rename IPSG to IPMG`

### Case 2 — Target already exists
If Target exists in Online Baseline, source(s) are merged into the existing Target.
- `IDS → IPMG`
- Baseline: IDS exists; IPMG exists
- Result: `Merge IDS into IPMG`

This rule also applies to multiple sources mapped to an already-existing target: all sources are Merge.

### Case 3 — Multiple Sources → New Target
If multiple sources map to the same Target and the Target does not exist in Online Baseline, the system must not guess which source owns the Rename.

Example:
- `IPSG → IPMG`
- `IDS → IPMG`
- Baseline: IPMG does not exist

Show:
`Multiple sources are mapped to the new target "IPMG". Please select a Primary Source.`

If Primary Source = IPSG:
- `Rename IPSG to IPMG`
- `Merge IDS into IPMG`

If Primary Source = IDS:
- `Rename IDS to IPMG`
- `Merge IPSG into IPMG`

Primary Source changes action semantics/logging but not the final hierarchy result.

## 9. Change Command validation
Excel Change Description/Action represents the user's declared intent but must not be executed unconditionally.

Validate it against Online Baseline + Mapping Rules:

- **Valid** — declared action matches rule; normal conversion.
- **Warning / Needs Review** — declared action conflicts with rule. Display the Excel Action, reason, and Suggested Action. Never silently rewrite it; user must confirm/correct it.
- **Required Action** — e.g. Multiple Sources → New Target; user must choose Primary Source.

Examples:
- Baseline IPMG absent; Excel says `Merge IPSG into IPMG` → suggest `Rename IPSG to IPMG`.
- Baseline IPMG exists; Excel says `Rename IDS to IPMG` → suggest `Merge IDS into IPMG`.
- Baseline IPMG absent; Excel says both `Rename IPSG to IPMG` and `Rename IDS to IPMG` → Required Action: select Primary Source.

## 10. Manual editing and logs
- Converted Data must support manual editing of hierarchy values.
- A manual hierarchy change should be recorded separately as a manual edit/audit event with before/after values and source `Manual Edit`.
- Upcoming Phase Out annotation alone must not create a log.
- Formal Mapping Change Log is generated when Confirm Mapping compares final Converted Data to Online Baseline.
- Do not generate a separate `Move` action in the log. Reassignment should be represented using the applicable Merge/reassignment semantics and a clear before/after hierarchy path.

## 11. Mapping evidence / recommendation (POC)
PDL is the stable comparison basis. Where feasible, show evidence such as matching PDLs and overlap ratio to explain suggested mappings. Recommendations are advisory; do not automatically infer business semantics such as Rename vs Merge when the deterministic rules require user input.

Example evidence: `3 / 3 PDL matched (100%)` plus the relevant PDL list.

## 12. Export
Export the final converted hierarchy in Excel-compatible workbook format while preserving the expected layout as faithfully as possible.

At minimum keep separate worksheets for:
- Standard PD Hierarchy
- Virtual Hierarchy

Also provide Mapping Change Log output (sheet or separate export according to POC implementation).

Upcoming Phase Out notation must remain visible in exported hierarchy. Original workbook formatting should be preserved where reasonably possible in the POC.

## 13. Persistence for POC
Online Baseline must not be cleared by repeated test uploads or test-data resets. For a standalone browser POC, browser persistence such as IndexedDB may be used so the baseline can survive page refresh/reopen; production implementation will use server/database persistence.

## 14. POC UI guidance
- Clearly separate Online Baseline upload from Test Excel upload.
- Always display Online Baseline filename after successful upload.
- Converted Data and Original Data should be visible on the same page (upper/lower sections) for comparison.
- Within each section, Standard / Virtual may use tabs when both exist.
- Provide clear status badges/messages for Valid, Needs Review, Required Action.
- Provide Primary Source selector for Case 3.
- Provide Confirm Mapping button; disable while unresolved validation issues remain.
- Provide export/download controls.

## 15. Scope note
This POC validates conversion and mapping behavior. Formal DB writes are out of scope. Database schema is documented separately for future system integration.
