#!/bin/bash

# Surreal Backend Test Runner
# Run with: ./test.sh

echo "Running Surreal Backend Tests..."
echo ""

uv run pytest tests/ -v
