"""Free Energy calculation for Active Inference reward modeling.

Free Energy = Divergence + Entropy
- Divergence: How far is this concept from the user's goal (center concept)?
- Entropy: How uncertain/poorly-grounded is this information?

The reward is the negative free energy (surprise minimization).
"""

import math
from typing import Optional

import numpy as np

from app.config import settings
from app.models.graph import MindMapState
from app.models.node import ConceptNode


def _jaccard_distance(text1: str, text2: str) -> float:
    """
    Calculate Jaccard distance as fallback when embeddings fail.

    Args:
        text1: First concept text
        text2: Second concept text

    Returns:
        Distance score (0.0 = identical, 1.0 = completely different)
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())

    if not words1 or not words2:
        return 1.0

    intersection = len(words1 & words2)
    union = len(words1 | words2)

    similarity = intersection / union if union > 0 else 0.0
    distance = 1.0 - similarity

    return distance


async def calculate_semantic_distance(
    text1: str,
    text2: str,
    embedding1: Optional[list[float]] = None,
    embedding2: Optional[list[float]] = None,
) -> float:
    """
    Calculate semantic distance between two concepts using embeddings.

    Falls back to Jaccard distance if embeddings are not available.

    Args:
        text1: First concept text
        text2: Second concept text
        embedding1: Optional pre-computed embedding for text1
        embedding2: Optional pre-computed embedding for text2

    Returns:
        Distance score (0.0 = identical, 1.0 = completely different)
    """
    # Import here to avoid circular dependency
    from app.services.embedding_service import cosine_distance, embedding_service

    # Try to use embeddings first
    try:
        # Get or generate embeddings
        if embedding1 is None:
            embedding1 = await embedding_service.generate_embedding(text1)

        if embedding2 is None:
            embedding2 = await embedding_service.generate_embedding(text2)

        # If both embeddings are available, use cosine distance
        if embedding1 is not None and embedding2 is not None:
            return cosine_distance(embedding1, embedding2)

    except Exception:
        # Fall through to Jaccard distance
        pass

    # Fallback to Jaccard distance
    return _jaccard_distance(text1, text2)


async def calculate_divergence(
    node: ConceptNode,
    center_concept: str,
    center_embedding: Optional[list[float]] = None,
) -> float:
    """
    Calculate divergence from self-concept (center topic).

    This measures relevance - how far is this node from the user's goal?

    Args:
        node: The concept node to evaluate
        center_concept: The user's initial topic/goal
        center_embedding: Optional pre-computed embedding for center concept

    Returns:
        Divergence score (0.0 = highly relevant, 1.0 = irrelevant)
    """
    # Get embedding from node metadata if available
    node_embedding = None
    if node.metadata and node.metadata.embedding:
        node_embedding = node.metadata.embedding

    # Use semantic distance between node concept and center concept
    divergence = await calculate_semantic_distance(
        node.concept, center_concept, node_embedding, center_embedding
    )

    return divergence


def calculate_entropy(node: ConceptNode) -> float:
    """
    Calculate entropy (uncertainty) for a concept node.

    High entropy indicates:
    - No sources found
    - Contradictory information
    - Missing metadata

    Args:
        node: The concept node to evaluate

    Returns:
        Entropy score (0.0 = certain, 1.0 = uncertain)
    """
    if node.metadata is None:
        # No metadata = maximum uncertainty
        return 1.0

    # Start with base uncertainty score from metadata
    entropy = node.metadata.uncertainty_score

    # Adjust based on source availability
    num_sources = len(node.metadata.sources) if node.metadata.sources else 0

    if num_sources == 0:
        # No sources = high entropy
        entropy = max(entropy, 0.9)
    elif num_sources == 1:
        # Single source = moderate entropy
        entropy = max(entropy, 0.6)
    elif num_sources >= 5:
        # Many sources = lower entropy (well-grounded)
        entropy = min(entropy, 0.3)

    # Missing summary increases entropy
    if not node.metadata.summary:
        entropy = min(entropy + 0.2, 1.0)

    # Clamp to [0.0, 1.0]
    return np.clip(entropy, 0.0, 1.0)


async def calculate_free_energy(
    node: ConceptNode,
    context: MindMapState,
    center_embedding: Optional[list[float]] = None,
) -> float:
    """
    Calculate Free Energy for a concept node.

    Free Energy = w_div * Divergence + w_ent * Entropy

    Where:
    - Divergence measures relevance to the user's goal
    - Entropy measures uncertainty/poor grounding

    Args:
        node: The concept node to evaluate
        context: The current graph state (for center concept)
        center_embedding: Optional pre-computed embedding for center concept

    Returns:
        Free Energy score (higher = more surprise)
    """
    divergence = await calculate_divergence(node, context.centerConcept, center_embedding)
    entropy = calculate_entropy(node)

    # Weighted combination
    free_energy = (
        settings.FREE_ENERGY_WEIGHT_DIVERGENCE * divergence
        + settings.FREE_ENERGY_WEIGHT_ENTROPY * entropy
    )

    return free_energy


def calculate_reward(
    free_energy_before: float,
    free_energy_after: float,
    action_type: Optional[str] = None,
) -> float:
    """
    Calculate reward signal from surprise reduction.

    Reward = Free Energy Before - Free Energy After

    Positive reward = action reduced surprise (good exploration)
    Negative reward = action increased surprise (poor choice)

    Args:
        free_energy_before: Free energy before taking action
        free_energy_after: Free energy after taking action
        action_type: Type of action taken (for logging/debugging)

    Returns:
        Reward signal (positive = good, negative = bad)
    """
    reward = free_energy_before - free_energy_after

    # Apply scaling to make rewards more interpretable
    # Typical range: -1.0 to 1.0
    scaled_reward = np.tanh(reward * 2.0)  # Compress to [-1, 1] range

    return float(scaled_reward)


async def calculate_expected_information_gain(
    node: ConceptNode,
    context: MindMapState,
    center_embedding: Optional[list[float]] = None,
) -> float:
    """
    Calculate expected information gain from expanding a node.

    This estimates how much we expect uncertainty to decrease if we expand this node.
    Higher values = more promising exploration targets.

    Args:
        node: The concept node to evaluate
        context: The current graph state
        center_embedding: Optional pre-computed embedding for center concept

    Returns:
        Expected information gain (higher = more valuable to explore)
    """
    # Current uncertainty
    current_entropy = calculate_entropy(node)

    # If already explored, information gain is low
    if node.isExplored:
        return 0.1

    # If high uncertainty and close to center concept = high value
    divergence = await calculate_divergence(node, context.centerConcept, center_embedding)

    # Expected gain is proportional to current uncertainty
    # and inversely proportional to divergence
    expected_gain = current_entropy * (1.0 - divergence)

    return expected_gain
