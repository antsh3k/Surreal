.PHONY: install run test format lint clean help

help:
	@echo "Surreal Backend - Makefile Commands"
	@echo "===================================="
	@echo "install    - Install dependencies with uv"
	@echo "run        - Run development server"
	@echo "test       - Run tests"
	@echo "format     - Format code with black and ruff"
	@echo "lint       - Lint code with ruff"
	@echo "clean      - Remove cache and temporary files"
	@echo ""

install:
	@echo "Installing dependencies..."
	uv sync --all-extras

run:
	@echo "Starting development server..."
	uv run uvicorn app.main:app --reload --port 8000

test:
	@echo "Running tests..."
	uv run pytest tests/ -v

format:
	@echo "Formatting code..."
	uv run black app/ tests/
	uv run ruff check app/ tests/ --fix

lint:
	@echo "Linting code..."
	uv run ruff check app/ tests/

clean:
	@echo "Cleaning cache and temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Clean complete!"
