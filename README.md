# PD-Hierarchy-Mapping-POC
POC tool for PD Hierarchy Excel conversion, mapping validation, rename/merge detection, and movement log generation.

Entry flow: **Official list → Test list → + New Test → Mapping → SAVE → Test list**.
Load the year's Official Excel first using the POC baseline loader. Saved Test records can be viewed, edited, and selected for the existing Go Live POC. Records persist in the current browser's localStorage; no production backend is connected.
