"""Core Active Inference logic for the Surreal backend."""

from app.core.free_energy import (
    calculate_divergence,
    calculate_entropy,
    calculate_expected_information_gain,
    calculate_free_energy,
    calculate_reward,
    calculate_semantic_distance,
)
from app.core.preference import (
    InteractionType,
    calculate_preference_gradient,
    get_preference_hint,
    get_score_delta,
    propagate_preference,
    rank_nodes_by_preference,
    suggest_next_node,
    update_multiple_nodes,
    update_preference_score,
)
from app.core.uncertainty import (
    assess_information_quality,
    calculate_uncertainty_score,
    get_visual_state,
    should_mark_explored,
    update_node_explored_status,
)

__all__ = [
    # Free Energy
    "calculate_semantic_distance",
    "calculate_divergence",
    "calculate_entropy",
    "calculate_free_energy",
    "calculate_reward",
    "calculate_expected_information_gain",
    # Uncertainty
    "calculate_uncertainty_score",
    "should_mark_explored",
    "update_node_explored_status",
    "get_visual_state",
    "assess_information_quality",
    # Preference Learning
    "InteractionType",
    "get_score_delta",
    "update_preference_score",
    "propagate_preference",
    "get_preference_hint",
    "rank_nodes_by_preference",
    "suggest_next_node",
    "calculate_preference_gradient",
    "update_multiple_nodes",
]
