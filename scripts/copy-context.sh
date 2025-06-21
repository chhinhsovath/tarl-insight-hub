#!/bin/bash

# Quick script to copy Claude context to clipboard
# Usage: ./scripts/copy-context.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTEXT_FILE="$SCRIPT_DIR/claude-snippet.txt"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    cat "$CONTEXT_FILE" | pbcopy
    echo "✅ Claude context copied to clipboard!"
    echo "🚀 Paste this into your new Claude Code conversation"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    cat "$CONTEXT_FILE" | xclip -selection clipboard
    echo "✅ Claude context copied to clipboard!"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    cat "$CONTEXT_FILE" | clip
    echo "✅ Claude context copied to clipboard!"
else
    echo "📋 Copy this manually:"
    echo "========================"
    cat "$CONTEXT_FILE"
fi