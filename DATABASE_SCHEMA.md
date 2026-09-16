# ACLDW PD Hierarchy — Current Database Schema

This document records the currently known schema for future integration. The browser POC does not write to these tables.

## Entity tables

### `[ACLDW].[dbo].[PDH_Pg]`
- Year
- PgId
- Name
- ShortName
- IsActive
- Virtual
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser
- Sort
- Floor
- IsEmanagerShown

### `[ACLDW].[dbo].[PDH_Md]`
- Year
- MdId
- Name
- IsActive
- Virtual
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser
- Sort
- Floor
- IsEmanagerShown

### `[ACLDW].[dbo].[PDH_Pd]`
- Year
- PdId
- Name
- IsActive
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser
- Sort
- Floor
- IsEmanagerShown

### `[ACLDW].[dbo].[PDH_Pdl]`
- Year
- PdlId
- Name
- Description
- IsSwNewPdl
- IsActive
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser
- IsPhaseOut
- PhaseOutDate
- Sort

## Relationship tables

### PG Group → PG: `[ACLDW].[dbo].[PDH_PgGroupPg]`
- PgGroupId
- PgId
- DataId
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser

### PG → MD: `[ACLDW].[dbo].[PDH_PgMd]`
- PgId
- MdId
- DataId
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser

### MD → PD: `[ACLDW].[dbo].[PDH_MdPd]`
- MdId
- PdId
- DataId
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser

### PD → PDL: `[ACLDW].[dbo].[PDH_PdPdl]`
- PdId
- PdlId
- DataId
- Description
- CreateDate
- UpdateDate
- CreateUser
- UpdateUser

## Hierarchy
`PG Group → PG → MD → PD → PDL`

Relationship path:
`PDH_PgGroupPg → PDH_Pg → PDH_PgMd → PDH_Md → PDH_MdPd → PDH_Pd → PDH_PdPdl → PDH_Pdl`

## Important integration observations
- PG and MD already contain a `Virtual` field.
- PDL already contains `IsPhaseOut` and `PhaseOutDate`; these represent actual Phase Out, not the POC's Upcoming Phase Out annotation.
- PG, MD, PD and PDL entity tables already contain `CreateDate` and `UpdateDate` fields.
- Rename should conceptually preserve entity identity/ID where applicable, while Merge may require relationship reassignment and lifecycle handling. Exact production DB mutation rules remain to be finalized before implementation.
