#!/bin/bash

# Function to remove single line and multi-line comments from TypeScript/JavaScript files
remove_comments() {
  # First pass: Remove single-line comments (//...)
  # Second pass: Remove multi-line comments (/* ... */)
  # Third pass: Remove JSDoc comments (/** ... */)
  perl -i -0pe 's|//.*$||gm;s|/\*[\s\S]*?\*/||g;s|/\*\*[\s\S]*?\*/||g' "$1"
  
  # Remove empty lines resulting from comment removals
  perl -i -0pe 's|\n\s*\n|\n|g' "$1"
}

# Find all TS/TSX/JS/JSX files and process them
find_files=$(find /Users/kolin/Desktop/Android/TiltMazeGame -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v "node_modules" | grep -v "build" | grep -v "dist")

for file in $find_files; do
  echo "Removing comments from $file"
  remove_comments "$file"
done

echo "All comments have been removed from the codebase."
