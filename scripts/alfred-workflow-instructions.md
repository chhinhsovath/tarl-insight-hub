# Alfred Workflow Setup for Claude Context

## Create Alfred Workflow (macOS Only)

### Steps:
1. Open Alfred Preferences
2. Go to Workflows tab
3. Click the "+" button and select "Blank Workflow"
4. Name it "Claude Context"
5. Right-click in the workflow area and select "Inputs > Keyword"
6. Set keyword to: `claude` or `context`
7. Right-click again and select "Actions > Copy to Clipboard"
8. Connect the keyword to the copy action
9. In the copy action, paste the content from `scripts/claude-snippet.txt`

### Usage:
- Open Alfred (Cmd+Space)
- Type `claude` 
- Press Enter
- Context is copied to clipboard
- Paste into new Claude Code conversation

## Alternative: Text Expander
If you have TextExpander:
1. Create new snippet
2. Abbreviation: `;claude` or `;context`
3. Content: Copy from `scripts/claude-snippet.txt`
4. Type `;claude` anywhere to expand the context