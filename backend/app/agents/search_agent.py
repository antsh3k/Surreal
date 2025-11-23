"""Search Agent for grounding concepts with Brave Search API."""

from typing import Optional

import httpx

from app.config import settings
from app.models.node import NodeMetadata
from app.utils import logger


class SearchAgent:
    """Agent for searching and validating concepts using Brave Search API."""

    def __init__(self) -> None:
        """Initialize the search agent with Brave API client."""
        self.api_key = settings.BRAVE_API_KEY
        self.base_url = "https://api.search.brave.com/res/v1/web/search"
        self.timeout = settings.SEARCH_TIMEOUT_SECONDS
        self.max_results = settings.BRAVE_MAX_RESULTS

    async def search_concept(
        self, query: str, max_results: Optional[int] = None
    ) -> list[dict[str, str]]:
        """
        Search for a concept using Brave Search API.

        Args:
            query: Search query string
            max_results: Maximum number of results to return (default from settings)

        Returns:
            List of search results with title, URL, and snippet
        """
        if max_results is None:
            max_results = self.max_results

        headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": self.api_key,
        }

        params = {
            "q": query,
            "count": max_results,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.base_url,
                    headers=headers,
                    params=params,
                )
                response.raise_for_status()
                data = response.json()

            # Parse results
            results = []
            if "web" in data and "results" in data["web"]:
                for item in data["web"]["results"]:
                    results.append(
                        {
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "snippet": item.get("description", ""),
                        }
                    )

            logger.info(f"Brave Search found {len(results)} results for: {query}")
            return results

        except httpx.HTTPError as e:
            logger.error(f"Brave Search API error for query '{query}': {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error in search for query '{query}': {str(e)}")
            return []

    async def validate_concept(self, concept: str, topic: str) -> NodeMetadata:
        """
        Validate a concept by searching for related information.

        Combines the concept with the topic to find relevant sources.

        Args:
            concept: The concept to validate
            topic: The central topic for context

        Returns:
            NodeMetadata with sources, keywords, and summary
        """
        # Create search query
        query = f"{concept} {topic}"

        # Search for results
        search_results = await self.search_concept(query)

        # Extract sources (URLs)
        sources = [result["url"] for result in search_results if result["url"]]

        # Extract keywords from titles and snippets
        keywords = self._extract_keywords(search_results)

        # Generate summary from snippets
        summary = self._generate_summary(search_results, concept)

        # Calculate uncertainty based on result quality
        uncertainty_score = self._calculate_uncertainty(search_results)

        # Generate embedding for the concept
        from app.services.embedding_service import embedding_service

        embedding = await embedding_service.generate_embedding(concept)

        metadata = NodeMetadata(
            sources=sources,
            keywords=keywords,
            summary=summary,
            uncertainty_score=uncertainty_score,
            embedding=embedding,
        )

        return metadata

    def _extract_keywords(self, results: list[dict[str, str]]) -> list[str]:
        """Extract keywords from search results."""
        # Simple keyword extraction (in production, use NLP)
        keywords = set()

        for result in results:
            title = result.get("title", "").lower()
            snippet = result.get("snippet", "").lower()

            # Split and filter common words
            words = (title + " " + snippet).split()
            filtered = [
                w.strip(".,!?;:")
                for w in words
                if len(w) > 4 and w.isalpha()  # At least 5 chars and alphabetic
            ]
            keywords.update(filtered[:5])  # Max 5 keywords per result

        return list(keywords)[:10]  # Return top 10 keywords

    def _generate_summary(self, results: list[dict[str, str]], concept: str) -> str:
        """Generate a summary from search results."""
        if not results:
            return f"No information found for: {concept}"

        # Use the first snippet as a basic summary
        first_snippet = results[0].get("snippet", "")

        if first_snippet:
            return first_snippet[:200]  # Max 200 chars
        else:
            return f"{concept} - See sources for more information"

    def _calculate_uncertainty(self, results: list[dict[str, str]]) -> float:
        """Calculate uncertainty based on search result quality."""
        num_results = len(results)

        if num_results == 0:
            return 1.0  # Maximum uncertainty
        elif num_results == 1:
            return 0.7  # High uncertainty
        elif num_results <= 3:
            return 0.5  # Moderate uncertainty
        elif num_results <= 5:
            return 0.3  # Low uncertainty
        else:
            return 0.2  # Very low uncertainty

    async def enrich_node_metadata(
        self, concept: str, topic: str, existing_metadata: Optional[NodeMetadata] = None
    ) -> NodeMetadata:
        """
        Enrich node metadata with search results.

        If metadata exists, merge with new search results.

        Args:
            concept: The concept to search for
            topic: The central topic for context
            existing_metadata: Optional existing metadata to merge with

        Returns:
            Enriched metadata
        """
        new_metadata = await self.validate_concept(concept, topic)

        if existing_metadata is None:
            return new_metadata

        # Merge with existing metadata
        merged_sources = list(set(existing_metadata.sources + new_metadata.sources))
        merged_keywords = list(set(existing_metadata.keywords + new_metadata.keywords))

        # Use new summary if old one is missing
        summary = existing_metadata.summary or new_metadata.summary

        # Take minimum uncertainty (more information = less uncertainty)
        uncertainty = min(existing_metadata.uncertainty_score, new_metadata.uncertainty_score)

        return NodeMetadata(
            sources=merged_sources[:10],  # Max 10 sources
            keywords=merged_keywords[:15],  # Max 15 keywords
            summary=summary,
            uncertainty_score=uncertainty,
        )
