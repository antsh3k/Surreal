"""Uncertainty quantification for epistemic status visualization.

Maps uncertainty scores to visual states:
- High uncertainty (>= threshold) → Dashed border (unexplored)
- Low uncertainty (< threshold) → Solid border (explored)
"""

from app.config import settings
from app.models.node import ConceptNode, NodeMetadata


def calculate_uncertainty_score(node: ConceptNode) -> float:
    """
    Calculate uncertainty score for a concept node.

    Returns a score between 0.0 (certain) and 1.0 (uncertain) based on:
    - Availability of sources
    - Completeness of metadata
    - Quality indicators

    Args:
        node: The concept node to evaluate

    Returns:
        Uncertainty score (0.0 = certain, 1.0 = uncertain)
    """
    # Start with maximum uncertainty
    uncertainty = 1.0

    # If no metadata, maximum uncertainty
    if node.metadata is None:
        return 1.0

    # Check sources
    num_sources = len(node.metadata.sources) if node.metadata.sources else 0

    if num_sources == 0:
        # No sources = high uncertainty
        uncertainty = 1.0
    elif num_sources == 1:
        # Single source = moderate-high uncertainty
        uncertainty = 0.7
    elif num_sources <= 3:
        # Few sources = moderate uncertainty
        uncertainty = 0.5
    elif num_sources <= 5:
        # Several sources = low-moderate uncertainty
        uncertainty = 0.3
    else:
        # Many sources = low uncertainty
        uncertainty = 0.2

    # Check metadata completeness
    if node.metadata.summary:
        # Has summary = reduce uncertainty
        uncertainty *= 0.8

    if node.metadata.keywords and len(node.metadata.keywords) > 0:
        # Has keywords = reduce uncertainty
        uncertainty *= 0.9

    # Use pre-calculated uncertainty score if available
    if hasattr(node.metadata, "uncertainty_score") and node.metadata.uncertainty_score is not None:
        # Blend with metadata uncertainty score
        uncertainty = (uncertainty + node.metadata.uncertainty_score) / 2.0

    # Clamp to [0.0, 1.0]
    uncertainty = max(0.0, min(1.0, uncertainty))

    return uncertainty


def should_mark_explored(
    node: ConceptNode, threshold: float = settings.UNCERTAINTY_THRESHOLD
) -> bool:
    """
    Determine if a node should be marked as explored (solid border).

    Args:
        node: The concept node to evaluate
        threshold: Uncertainty threshold (default from settings)

    Returns:
        True if node should be marked explored (solid border)
        False if node should remain unexplored (dashed border)
    """
    uncertainty = calculate_uncertainty_score(node)
    return uncertainty < threshold


def update_node_explored_status(node: ConceptNode) -> ConceptNode:
    """
    Update a node's isExplored status based on uncertainty.

    This should be called after metadata is updated (e.g., after search).

    Args:
        node: The concept node to update

    Returns:
        Updated node with correct isExplored status
    """
    node.isExplored = should_mark_explored(node)
    return node


def get_visual_state(node: ConceptNode) -> dict:
    """
    Get visual state indicators for a node.

    Returns information about how the node should be rendered:
    - border_style: "dashed" or "solid"
    - border_color: Based on preference score
    - background_tint: Based on preference score

    Args:
        node: The concept node to evaluate

    Returns:
        Dictionary with visual state information
    """
    uncertainty = calculate_uncertainty_score(node)

    # Determine border style
    border_style = "dashed" if uncertainty >= settings.UNCERTAINTY_THRESHOLD else "solid"

    # Determine colors based on preference score
    if node.preferenceScore > settings.PREFERENCE_THRESHOLD_PREFERRED:
        # Preferred = green
        border_color = "green"
        background_tint = "green-50"
        hint = "preferred"
    elif node.preferenceScore < settings.PREFERENCE_THRESHOLD_UNCERTAIN:
        # Uncertain relevance = orange
        border_color = "orange"
        background_tint = "orange-50"
        hint = "uncertain"
    else:
        # Neutral
        border_color = "gray" if border_style == "dashed" else "black"
        background_tint = "white"
        hint = "neutral"

    return {
        "border_style": border_style,
        "border_color": border_color,
        "background_tint": background_tint,
        "hint": hint,
        "uncertainty_score": uncertainty,
        "is_explored": node.isExplored,
    }


def assess_information_quality(node: ConceptNode) -> dict:
    """
    Assess the quality of information for a node.

    Provides detailed breakdown of what contributes to uncertainty.

    Args:
        node: The concept node to evaluate

    Returns:
        Dictionary with quality assessment
    """
    if node.metadata is None:
        return {
            "has_sources": False,
            "source_count": 0,
            "has_summary": False,
            "has_keywords": False,
            "overall_quality": "poor",
            "uncertainty": 1.0,
        }

    num_sources = len(node.metadata.sources) if node.metadata.sources else 0
    has_summary = bool(node.metadata.summary)
    has_keywords = bool(node.metadata.keywords and len(node.metadata.keywords) > 0)

    # Determine overall quality
    if num_sources >= 5 and has_summary and has_keywords:
        quality = "excellent"
    elif num_sources >= 3 and has_summary:
        quality = "good"
    elif num_sources >= 1:
        quality = "fair"
    else:
        quality = "poor"

    uncertainty = calculate_uncertainty_score(node)

    return {
        "has_sources": num_sources > 0,
        "source_count": num_sources,
        "has_summary": has_summary,
        "has_keywords": has_keywords,
        "overall_quality": quality,
        "uncertainty": uncertainty,
    }
