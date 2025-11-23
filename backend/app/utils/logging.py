"""Logging configuration for the application."""

import logging
import sys
from typing import Any

from app.config import settings


def setup_logging() -> logging.Logger:
    """Configure and return the application logger."""
    # Create logger
    logger = logging.getLogger("surreal")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Create formatter
    if settings.is_development:
        # Detailed format for development
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        # JSON-like format for production (structured logging)
        formatter = logging.Formatter(
            fmt='{"time":"%(asctime)s","name":"%(name)s","level":"%(levelname)s",'
            '"function":"%(funcName)s","line":%(lineno)d,"message":"%(message)s"}',
            datefmt="%Y-%m-%dT%H:%M:%S",
        )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logging()


def log_api_call(endpoint: str, **kwargs: Any) -> None:
    """Log an API call with parameters."""
    logger.info(f"API call to {endpoint}", extra=kwargs)


def log_error(error: Exception, context: str = "") -> None:
    """Log an error with context."""
    logger.error(f"{context}: {str(error)}", exc_info=True)


def log_reward(action: str, reward: float, node_id: str) -> None:
    """Log a reward signal (for RL debugging)."""
    logger.debug(f"Reward: {reward:.3f} for {action} on node {node_id}")
