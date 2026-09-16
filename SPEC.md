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
2. Upload a test PD Hierarchy Excel. Test Excel can be uploaded repeatedly and its Change Command may be blank.
3. Parse the complete workbook and compare the uploaded hierarchy against the immutable Online Baseline.
4. Infer hierarchy differences and generate Suggested Change Command(s) where deterministic rules allow.
5. Show Original Data and Converted Data.
6. Allow users to review/accept/edit suggested commands and manually edit Converted Data.
7. Validate declared or accepted Change Commands against mapping rules and Online Baseline.
8. Resolve warnings and required actions.
9. User clicks **Confirm Mapping**.
10. Compare final Converted Data against the immutable Online Baseline.
11. Generate Mapping Change Log / Confirm Mapping output.
12. Export converted Excel while preserving required workbook structure.

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
- **Change Command** — structured/fixed action semantics for system processing.
- **Change Description** — user-readable description, defaulted from the action/command and freely editable.

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

## 8. No physical Delete / hierarchy lifecycle rules
**Physical Delete is prohibited for hierarchy processing.** Historical hierarchy entities must be retained rather than removed from the data model. The only special exception is MD, described below.

### PDL
- PDL is never deleted.
- When a PDL is no longer used, it follows the **Phase Out** lifecycle.
- Upcoming Phase Out and actual Phase Out are different states; Upcoming Phase Out is annotation only.

### PD
- PD is never deleted.
- If a PD no longer has any active/remaining PDL underneath it, the PD is considered **disabled/inactive** rather than deleted.
- Its identity/name/history remains available.

### PG and other parent hierarchy levels
- The same principle applies upward: hierarchy nodes are not physically deleted merely because they no longer have active descendants.
- They become disabled/inactive as applicable, while historical identity and hierarchy history are retained.

### MD — special exception
MD is the only hierarchy level where a user may perform a business-level **Delete MD** operation. However, this does **not** mean physically deleting descendant hierarchy data.

The semantics of Delete MD are:
- Remove/clear the MD name/node representation from the resulting hierarchy.
- Do not delete its PDs, PDLs, PGs, or other hierarchy entities.
- Preserve all descendant entities and re-establish their valid hierarchy relationships according to the converted target structure.
- The operation must never cascade into physical deletion of PD/PDL or other hierarchy records.

For the POC, `Delete MD` should therefore be treated as a special MD-level transformation, not a generic database DELETE action.

### Validation
- Generic `Delete PG`, `Delete PD`, and `Delete PDL` commands are invalid and must be rejected/flagged for review.
- `Delete PDL` should be redirected conceptually to the appropriate Phase Out process.
- A PD with no remaining PDL should be represented as disabled/inactive, not deleted.
- Any transformation that empties a higher-level node should preserve the node/history and mark it inactive as applicable, except for the special MD name-removal rule above.

## 9. Rename / Merge — mandatory batch evaluation
Rename/Merge determination MUST use **Batch Evaluation**, never sequential row-by-row state mutation.

Before conversion, create an immutable snapshot of the Online PD Hierarchy. Parse the complete set of Excel hierarchy data and any supplied Change Commands first, group differences by `Hierarchy Level + Target`, evaluate rules, then generate Converted Data and command suggestions.

Target existence is always determined against the Online Baseline Snapshot at the same hierarchy level. It must never be determined from a Converted Data state modified by an earlier Excel row. Therefore changing Excel row order must not change the result.

### Case 1 — Single Source → New Target
If Target does not exist in Online Baseline:
- `IPSG → IPMG`
- Baseline: IPSG exists; IPMG does not exist
- Suggested/Result: `Rename IPSG to IPMG`

### Case 2 — Target already exists
If Target exists in Online Baseline, source(s) are merged into the existing Target.
- `IDS → IPMG`
- Baseline: IDS exists; IPMG exists
- Suggested/Result: `Merge IDS into IPMG`

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

## 10. Suggested Change Command workflow
**Change Command is allowed to be blank in an uploaded Test Excel.** A blank command must not prevent the workbook from being uploaded or compared.

When Change Command is blank:
1. Compare the uploaded hierarchy against the immutable Online Baseline.
2. Detect hierarchy differences at the applicable level.
3. Apply the deterministic mapping rules in this specification.
4. Generate a **Suggested Change Command** where the rule is unambiguous.
5. Display the suggestion, reason/evidence, and review status to the user.
6. The user may **Accept Suggestion** or manually modify/select the final Change Command.
7. Only after user acceptance/review does the suggestion become the effective Change Command for Confirm Mapping.

The system must not silently write a suggestion as though it were user-confirmed.

Suggested commands may include, as applicable:
- `Add ...`
- `Rename ... to ...`
- `Merge ... into ...`
- `Face Out ...`
- special MD-level `Delete MD ...` transformation when the hierarchy difference clearly satisfies the MD rule.

For **Multiple Sources → New Target**, the system must not automatically choose a Primary Source. Status is `Required Action`; after the user selects the Primary Source, the system generates the corresponding Rename + Merge commands.

Recommended review-grid columns:
- **Change Command** — current/confirmed command; may initially be blank.
- **Suggested Change Command** — system recommendation.
- **Reason / Evidence** — why the system made the recommendation, including Baseline target existence and/or PDL overlap where applicable.
- **Status** — `Valid`, `Needs Review`, or `Required Action`.
- **Action** — e.g. `Accept Suggestion`, Edit, or Select Primary Source.

Example:

| Change Command | Suggested Change Command | Reason / Evidence | Status |
|---|---|---|---|
| *(Blank)* | `Rename IPSG to IPMG` | Single Source → New Target; IPMG absent in Baseline | Needs Review |
| *(Blank)* | `Merge IDS into IPMG` | Target IPMG exists in Baseline | Needs Review |
| *(Blank)* | Pending Primary Source | Multiple Sources → New Target | Required Action |

## 11. Change Command validation
A Change Command supplied in Excel or entered/accepted by the user represents declared intent but must not be executed unconditionally.

Validate it against Online Baseline + Mapping Rules:

- **Valid** — declared/accepted action matches rule; normal conversion.
- **Warning / Needs Review** — declared action conflicts with rule, or a system suggestion has not yet been accepted. Display the current Change Command, reason, and Suggested Change Command. Never silently rewrite it; user must confirm/correct it.
- **Required Action** — e.g. Multiple Sources → New Target; user must choose Primary Source.

Examples:
- Baseline IPMG absent; Excel says `Merge IPSG into IPMG` → suggest `Rename IPSG to IPMG`.
- Baseline IPMG exists; Excel says `Rename IDS to IPMG` → suggest `Merge IDS into IPMG`.
- Baseline IPMG absent; Excel says both `Rename IPSG to IPMG` and `Rename IDS to IPMG` → Required Action: select Primary Source.
- Excel declares generic Delete for PG/PD/PDL → invalid/Needs Review; use lifecycle rules instead.

## 12. Manual editing and logs
- Converted Data must support manual editing of hierarchy values.
- A manual hierarchy change should be recorded separately as a manual edit/audit event with before/after values and source `Manual Edit`.
- Upcoming Phase Out annotation alone must not create a log.
- Formal Mapping Change Log is generated when Confirm Mapping compares final Converted Data to Online Baseline.
- Do not generate a separate `Move` action in the log. Reassignment should be represented using the applicable Merge/reassignment semantics and a clear before/after hierarchy path.
- Never generate a physical-delete operation for PG/PD/PDL from the POC output.

## 13. Mapping evidence / recommendation (POC)
PDL is the stable comparison basis. Where feasible, show evidence such as matching PDLs and overlap ratio to explain suggested mappings. Recommendations are advisory; do not automatically infer business semantics such as Rename vs Merge when the deterministic rules require user input.

Example evidence: `3 / 3 PDL matched (100%)` plus the relevant PDL list.

## 14. Export
Export the final converted hierarchy in Excel-compatible workbook format while preserving the expected layout as faithfully as possible.

At minimum keep separate worksheets for:
- Standard PD Hierarchy
- Virtual Hierarchy

Also provide Mapping Change Log output (sheet or separate export according to POC implementation).

Upcoming Phase Out notation must remain visible in exported hierarchy. Original workbook formatting should be preserved where reasonably possible in the POC.

## 15. Persistence for POC
Online Baseline must not be cleared by repeated test uploads or test-data resets. For a standalone browser POC, browser persistence such as IndexedDB may be used so the baseline can survive page refresh/reopen; production implementation will use server/database persistence.

## 16. POC UI guidance
- Clearly separate Online Baseline upload from Test Excel upload.
- Always display Online Baseline filename after successful upload.
- Converted Data and Original Data should be visible on the same page (upper/lower sections) for comparison.
- Within each section, Standard / Virtual may use tabs when both exist.
- Provide clear status badges/messages for Valid, Needs Review, Required Action.
- Show Suggested Change Command and its reason/evidence when Change Command is blank or inconsistent.
- Provide Accept Suggestion control.
- Provide Primary Source selector for Case 3.
- Provide Confirm Mapping button; disable while unresolved validation issues remain.
- Provide export/download controls.

## 17. POC reference test files
The initial POC is intended to be validated using these business snapshots supplied for development:
- **Baseline:** PD Hierarchy established on `2025/12/31` for the 2026 hierarchy.
- **Test hierarchy:** hierarchy snapshot dated `2026/07/17`, where Change Command may be blank and the system should derive suggestions by comparison with the Baseline.

The test hierarchy is not itself the Online Baseline and must never replace the Baseline implicitly.

## 18. Scope note
This POC validates conversion and mapping behavior. Formal DB writes are out of scope. Database schema is documented separately for future system integration.
