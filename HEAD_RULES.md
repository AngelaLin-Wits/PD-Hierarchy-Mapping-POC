# Head validation and change history

- Load EZ_Profile.csv in the browser. The directory is kept in memory, never shipped with the public site. Fields: EMPLR_ID, EMAIL_ADDR, ENG_NAME, IsActive, Department. Only active employees with valid email are selectable.
- Blank Head is allowed. Multiple Heads are separated by semicolons. Match names or email case-insensitively after collapsing whitespace. Unique matches pass; ambiguous/unmatched entries require explicit selection, or explicit clearing. Persist selected employee IDs, names and emails with the Test/Official workbook.
- Upload validates Head cells in both Official baseline and Test. Keep the raw original workbook snapshot for faithful OOXML export.
- Head changes are Mapping commands: `MD Head David Li; Julia Wong`, `MD Head Clear`, or `Set MD Head "Division Name" to "David Li"`. A search/select control creates these commands. Accept applies them after hierarchy Rename/Merge commands. Head cells are displayed read-only; all Head changes go through commands.
- Save is blocked until Review and Head validation complete. Legacy Test records with nonblank unvalidated Heads must be edited and saved before Go Live.
- Go Live compares Test with the latest Official. Head identity sets ignore order. Rename can retain the previous entity's Heads. Confirmed Head differences appear in the comparison and confirmed log.
- Change Description keeps Official history, appends actual command/head differences with sequential per-row `1.`, `2.`, etc., and uses Effective Date formatted YYYY/MM/DD. Example: `3. (2026/10/10) MD Head David Li`. Multiple Heads list all new names; clearing uses `MD Head 清空`.
- Official export uses the stored completed workbook and original Excel format. Repeated downloads do not modify history.
