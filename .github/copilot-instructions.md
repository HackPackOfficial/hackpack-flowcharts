# GitHub Copilot Instructions

## JSON and JSONC Files

When working with `.json` and `.jsonc` files:

### DO NOT:
- Generate complete new debugging steps or task sequences
- Auto-fill step content, arguments, or logic
- Suggest new step implementations
- Complete step definitions with actual values

### DO:
- Suggest only boilerplate structure for new entries
- Provide empty strings for all value fields
- Suggest content from elsewhere in the file when moving/reorganizing existing items
- Mirror existing patterns when duplicating structure
- Complete property names
- Fix grammar and spelling

### Examples:

**When reorganizing:**
- If I'm copying/moving an existing step, suggest the actual values from that step
- If I'm creating a new step, only provide the empty structure
