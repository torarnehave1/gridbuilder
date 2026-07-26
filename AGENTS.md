# Agent Guidelines & Single Source of Truth (SSOT) Rules

## Strict Graph and Node Management Rules

1. **SINGLE SOURCE OF TRUTH (SSOT) INTEGRITY**:
   - **DO NOT** use AI to automatically create new graphs, duplicate existing graphs, or generate duplicate nodes behind the scenes.
   - **ALWAYS ASK FOR PERMISSION** before creating a new graph, duplicating a graph, or saving new nodes to an external graph/database.
   - Never auto-spawn or duplicate nodes in the workspace layout without direct user consent.

2. **User Confirmation Requirement**:
   - Before performing any graph creation or node duplication action, prompt the user explicitly for confirmation.
   - Maintain the active graph context cleanly without polluting or duplicating data.
