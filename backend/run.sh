#!/bin/bash

# Surreal Backend Development Server
# Run with: ./run.sh

echo "Starting Surreal Backend API..."
echo "Environment: development"
echo "API will be available at: http://localhost:8000"
echo "Interactive docs at: http://localhost:8000/docs"
echo ""

# Run with uvicorn in reload mode
uv run uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
