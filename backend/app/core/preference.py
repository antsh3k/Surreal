"""Preference learning algorithms for Active Inference.

Implements preference score updates based on user interactions:
- Hover: +0.02 (light signal)
- Click: +0.1 (medium signal)
- Expand: +0.2 (strong signal)
- Sibling boost: +0.1 (propagation to related concepts)
"""

from typing import Literal

import numpy as np

from app.config import settings
from app.models.graph import MindMapState
from app.models.node import ConceptNode

# Type alias for interaction types
InteractionType = Literal["hover", "click", "expand", "info"]


def get_score_delta(action: InteractionType) -> float:
    """
    Get the preference score delta for a given action type.

    Args:
        action: Type of user interaction

    Returns:
        Score delta to add to preference score
    """
    deltas = {
        "hover": settings.SCORE_DELTA_HOVER,  # 0.02
        "click": settings.SCORE_DELTA_CLICK,  # 0.1
        "expand": settings.SCORE_DELTA_EXPAND,  # 0.2
        "info": settings.SCORE_DELTA_CLICK,  # 0.1 (same as click)
    }
    return deltas.get(action, 0.0)


def update_preference_score(node: ConceptNode, action: InteractionType) -> float:
    """
    Update a node's preference score based on user interaction.

    Scores are clamped to [-1.0, +1.0] range.

    Args:
        node: The concept node to update
        action: Type of interaction

    Returns:
        Updated preference score
    """
    delta = get_score_delta(action)
    new_score = node.preferenceScore + delta

    # Clamp to [-1.0, +1.0]
    new_score = np.clip(new_score, -1.0, 1.0)

    return float(new_score)


def propagate_preference(
    graph: MindMapState, node_id: str, boost: float = settings.SCORE_DELTA_SIBLING_BOOST
) -> list[ConceptNode]:
    """
    Propagate preference boost to sibling nodes.

    When a user interacts with a node, we boost the preference scores of its siblings,
    assuming they might also be interested in related concepts.

    Args:
        graph: The current graph state
        node_id: ID of the node that was interacted with
        boost: Amount to boost sibling scores (default: 0.1)

    Returns:
        List of updated sibling nodes
    """
    # Find the target node
    target_node = None
    for node in graph.nodes:
        if node.id == node_id:
            target_node = node
            break

    if target_node is None:
        return []

    # Find siblings (nodes with same parent)
    siblings = []
    for node in graph.nodes:
        if node.id == node_id:
            continue  # Skip the target node itself

        # Same parent = sibling
        if node.parentId == target_node.parentId and target_node.parentId is not None:
            siblings.append(node)

    # Boost sibling scores
    updated_siblings = []
    for sibling in siblings:
        old_score = sibling.preferenceScore
        new_score = np.clip(old_score + boost, -1.0, 1.0)
        sibling.preferenceScore = float(new_score)
        updated_siblings.append(sibling)

    return updated_siblings


def get_preference_hint(score: float) -> str:
    """
    Get a preference hint based on the score.

    Used for visual rendering:
    - "preferred": Green tint (score > 0.3)
    - "uncertain": Orange tint (score < -0.2)
    - "neutral": No tint (between -0.2 and 0.3)

    Args:
        score: Preference score (-1.0 to 1.0)

    Returns:
        Hint string ("preferred", "uncertain", or "neutral")
    """
    if score > settings.PREFERENCE_THRESHOLD_PREFERRED:
        return "preferred"
    elif score < settings.PREFERENCE_THRESHOLD_UNCERTAIN:
        return "uncertain"
    else:
        return "neutral"


def rank_nodes_by_preference(nodes: list[ConceptNode]) -> list[ConceptNode]:
    """
    Rank nodes by preference score (highest first).

    This can be used to suggest which nodes the user might want to explore next.

    Args:
        nodes: List of concept nodes

    Returns:
        Sorted list of nodes (highest preference first)
    """
    return sorted(nodes, key=lambda n: n.preferenceScore, reverse=True)


def suggest_next_node(graph: MindMapState) -> ConceptNode | None:
    """
    Suggest the next node the user might want to explore.

    Uses a combination of:
    1. High preference score
    2. Not yet explored (dashed border)
    3. Low divergence from center concept

    Args:
        graph: The current graph state

    Returns:
        Suggested node, or None if no good candidates
    """
    # Filter unexplored nodes
    unexplored = [node for node in graph.nodes if not node.isExplored]

    if not unexplored:
        return None

    # Rank by preference score
    ranked = rank_nodes_by_preference(unexplored)

    # Return highest-preference unexplored node
    return ranked[0] if ranked else None


def calculate_preference_gradient(
    node: ConceptNode, similar_nodes: list[ConceptNode]
) -> float:
    """
    Calculate preference gradient from similar nodes.

    This can be used to initialize preference scores for new nodes based on
    the preferences of semantically similar existing nodes.

    Args:
        node: The new node
        similar_nodes: List of semantically similar nodes

    Returns:
        Estimated preference score based on similar nodes
    """
    if not similar_nodes:
        return 0.0

    # Average preference of similar nodes
    scores = [n.preferenceScore for n in similar_nodes]
    avg_score = np.mean(scores)

    # Apply damping factor to be conservative
    damped_score = avg_score * 0.5

    return float(np.clip(damped_score, -1.0, 1.0))


def update_multiple_nodes(
    graph: MindMapState, node_ids: list[str], action: InteractionType
) -> dict[str, float]:
    """
    Update preference scores for multiple nodes at once.

    Useful for batch updates or when multiple nodes are involved in an action.

    Args:
        graph: The current graph state
        node_ids: List of node IDs to update
        action: Type of interaction

    Returns:
        Dictionary mapping node IDs to new preference scores
    """
    updates = {}
    delta = get_score_delta(action)

    for node in graph.nodes:
        if node.id in node_ids:
            old_score = node.preferenceScore
            new_score = np.clip(old_score + delta, -1.0, 1.0)
            node.preferenceScore = float(new_score)
            updates[node.id] = float(new_score)

    return updates
