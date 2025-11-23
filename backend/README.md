# Surreal Backend

Active Inference Knowledge Graph Engine - FastAPI Backend

## Installation

```bash
# Install dependencies
uv sync --all-extras

# Run development server
uv run uvicorn app.main:app --reload --port 8000
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required API keys:
- `GEMINI_API_KEY` - Google Gemini 1.5 Pro
- `BRAVE_API_KEY` - Brave Search API
- `MONGODB_URI` - MongoDB Atlas connection string

## Development

```bash
# Run tests
uv run pytest tests/ -v

# Format code
uv run black app/ tests/

# Lint code
uv run ruff check app/ tests/

# Type check
uv run mypy app/
```

## Architecture

See `/docs/` directory in the root project for detailed architecture documentation.
