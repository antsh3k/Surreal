"""Embedding Service for generating and caching semantic embeddings using Gemini."""

from functools import lru_cache
from typing import Optional

import numpy as np
from google import genai
from google.genai.types import EmbedContentConfig

from app.config import settings
from app.utils import logger


class EmbeddingService:
    """Service for generating and caching semantic embeddings."""

    def __init__(self) -> None:
        """Initialize the embedding service with Gemini client."""
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION
        self.use_cache = settings.USE_EMBEDDING_CACHE

        # Simple in-memory cache for embeddings
        self._cache: dict[str, list[float]] = {}

    async def generate_embedding(self, text: str) -> Optional[list[float]]:
        """
        Generate embedding for a text string.

        Uses Gemini Embedding API with caching for efficiency.

        Args:
            text: Text to embed

        Returns:
            Embedding vector as list of floats, or None if generation fails
        """
        # Check cache first
        if self.use_cache and text in self._cache:
            logger.debug(f"Embedding cache hit for text: {text[:50]}...")
            return self._cache[text]

        try:
            # Generate embedding using Gemini
            result = self.client.models.embed_content(
                model=self.model,
                contents=text,
                config=EmbedContentConfig(
                    task_type="SEMANTIC_SIMILARITY",
                ),
            )

            # Extract embedding vector
            embedding = result.embeddings[0].values

            # Cache it
            if self.use_cache and len(self._cache) < settings.EMBEDDING_CACHE_SIZE:
                self._cache[text] = embedding

            logger.debug(f"Generated embedding for text: {text[:50]}... (dim={len(embedding)})")
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {str(e)}")
            return None

    async def generate_embeddings_batch(
        self, texts: list[str]
    ) -> dict[str, Optional[list[float]]]:
        """
        Generate embeddings for multiple texts in batch.

        More efficient than calling generate_embedding multiple times.

        Args:
            texts: List of texts to embed

        Returns:
            Dictionary mapping text to embedding vector
        """
        results: dict[str, Optional[list[float]]] = {}

        # Check cache for each text
        uncached_texts = []
        for text in texts:
            if self.use_cache and text in self._cache:
                results[text] = self._cache[text]
            else:
                uncached_texts.append(text)

        if not uncached_texts:
            return results

        try:
            # Generate embeddings in batch
            batch_result = self.client.models.embed_content(
                model=self.model,
                contents=uncached_texts,
                config=EmbedContentConfig(
                    task_type="SEMANTIC_SIMILARITY",
                ),
            )

            # Process results
            for text, embedding_data in zip(uncached_texts, batch_result.embeddings):
                embedding = embedding_data.values
                results[text] = embedding

                # Cache it
                if self.use_cache and len(self._cache) < settings.EMBEDDING_CACHE_SIZE:
                    self._cache[text] = embedding

            logger.info(f"Generated {len(uncached_texts)} embeddings in batch")

        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {str(e)}")
            # Fill with None for failed generations
            for text in uncached_texts:
                if text not in results:
                    results[text] = None

        return results

    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self._cache.clear()
        logger.info("Embedding cache cleared")

    def get_cache_size(self) -> int:
        """Get current cache size."""
        return len(self._cache)


# Helper functions for vector operations
def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Args:
        vec1: First vector
        vec2: Second vector

    Returns:
        Cosine similarity score (0.0 to 1.0, higher = more similar)
    """
    if not vec1 or not vec2:
        return 0.0

    # Convert to numpy arrays
    v1 = np.array(vec1)
    v2 = np.array(vec2)

    # Calculate cosine similarity
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    similarity = dot_product / (norm1 * norm2)

    # Clamp to [0, 1] range (sometimes numerical errors cause slight overflow)
    return float(np.clip(similarity, 0.0, 1.0))


def cosine_distance(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculate cosine distance between two vectors.

    Distance = 1 - similarity

    Args:
        vec1: First vector
        vec2: Second vector

    Returns:
        Cosine distance (0.0 to 1.0, higher = more different)
    """
    similarity = cosine_similarity(vec1, vec2)
    return 1.0 - similarity


# Global embedding service instance
embedding_service = EmbeddingService()
