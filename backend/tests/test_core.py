"""Basic tests for core Active Inference logic."""

import pytest

from app.core import (
    calculate_divergence,
    calculate_entropy,
    calculate_free_energy,
    calculate_reward,
    get_preference_hint,
    update_preference_score,
)
from app.models import ConceptNode, MindMapState, NodeMetadata


def create_test_node(
    concept: str = "Test Concept",
    metadata: NodeMetadata | None = None,
    preference_score: float = 0.0,
) -> ConceptNode:
    """Helper to create a test node."""
    return ConceptNode(
        id="test_1",
        label="Test",
        concept=concept,
        isExplored=False,
        preferenceScore=preference_score,
        position={"x": 100.0, "y": 200.0},
        metadata=metadata,
    )


def test_calculate_divergence() -> None:
    """Test divergence calculation between concepts."""
    node = create_test_node("Active Inference")
    center_concept = "Active Inference in AI"

    divergence = calculate_divergence(node, center_concept)

    assert 0.0 <= divergence <= 1.0
    assert divergence < 0.5  # Should be similar concepts


def test_calculate_entropy() -> None:
    """Test entropy calculation for nodes."""
    # Node with no metadata = high entropy
    node_no_meta = create_test_node()
    entropy_no_meta = calculate_entropy(node_no_meta)
    assert entropy_no_meta == 1.0

    # Node with sources = lower entropy
    node_with_sources = create_test_node(
        metadata=NodeMetadata(
            sources=["https://example.com/1", "https://example.com/2"],
            keywords=["test", "concept"],
            summary="A test concept",
            uncertainty_score=0.3,
        )
    )
    entropy_with_sources = calculate_entropy(node_with_sources)
    assert entropy_with_sources < entropy_no_meta


def test_calculate_free_energy() -> None:
    """Test free energy calculation."""
    node = create_test_node(
        "Active Inference",
        metadata=NodeMetadata(
            sources=["https://example.com"],
            keywords=["test"],
            summary="Test",
            uncertainty_score=0.5,
        ),
    )
    context = MindMapState(
        centerConcept="Active Inference in AI", nodes=[], isGenerating=False
    )

    free_energy = calculate_free_energy(node, context)

    assert isinstance(free_energy, float)
    assert 0.0 <= free_energy <= 1.0


def test_calculate_reward() -> None:
    """Test reward calculation from surprise reduction."""
    # Reduction in free energy = positive reward
    reward = calculate_reward(free_energy_before=0.8, free_energy_after=0.3)

    assert isinstance(reward, float)
    assert reward > 0  # Surprise was reduced

    # Increase in free energy = negative reward
    reward_negative = calculate_reward(free_energy_before=0.3, free_energy_after=0.8)

    assert reward_negative < 0  # Surprise increased


def test_update_preference_score() -> None:
    """Test preference score updates."""
    node = create_test_node(preference_score=0.0)

    # Test hover action
    new_score = update_preference_score(node, "hover")
    assert new_score == 0.02

    # Test click action
    node.preferenceScore = 0.0
    new_score = update_preference_score(node, "click")
    assert new_score == 0.1

    # Test expand action
    node.preferenceScore = 0.0
    new_score = update_preference_score(node, "expand")
    assert new_score == 0.2

    # Test clamping
    node.preferenceScore = 0.95
    new_score = update_preference_score(node, "expand")
    assert new_score <= 1.0


def test_get_preference_hint() -> None:
    """Test preference hint generation."""
    # Preferred
    hint = get_preference_hint(0.5)
    assert hint == "preferred"

    # Uncertain
    hint = get_preference_hint(-0.5)
    assert hint == "uncertain"

    # Neutral
    hint = get_preference_hint(0.0)
    assert hint == "neutral"
