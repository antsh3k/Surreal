"""Pydantic models for API requests and responses."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.graph import MindMapState
from app.models.node import ConceptNode


# Request Models
class InitTopicRequest(BaseModel):
    """Request to initialize a new knowledge graph from a topic."""

    topic: str = Field(..., min_length=1, description="The initial topic/concept to explore")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {"example": {"topic": "Active Inference in AI"}}


class ExpandNodeRequest(BaseModel):
    """Request to expand a node and generate child concepts."""

    node_id: str = Field(..., description="ID of the node to expand")
    context: MindMapState = Field(..., description="Current graph state for context")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "node_id": "node_1",
                "context": {
                    "centerConcept": "Active Inference",
                    "nodes": [],
                    "isGenerating": False,
                    "loadingNodeId": None,
                    "selectedNodeId": None,
                    "infoPanel": None,
                },
            }
        }


class PreferenceUpdateRequest(BaseModel):
    """Request to update a node's preference score based on user interaction."""

    node_id: str = Field(..., description="ID of the node to update")
    action: Literal["hover", "click", "expand", "info"] = Field(
        ..., description="Type of interaction"
    )
    context: MindMapState = Field(..., description="Current graph state")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "node_id": "node_1",
                "action": "click",
                "context": {
                    "centerConcept": "Active Inference",
                    "nodes": [],
                    "isGenerating": False,
                    "loadingNodeId": None,
                    "selectedNodeId": None,
                    "infoPanel": None,
                },
            }
        }


# Response Models
class InitTopicResponse(BaseModel):
    """Response containing initial concept nodes."""

    nodes: list[ConceptNode] = Field(..., description="Initial concept nodes (Layer 1)")
    centerNode: ConceptNode = Field(..., description="The center/self node")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "centerNode": {
                    "id": "center",
                    "label": "Active Inference",
                    "concept": "Active Inference in AI",
                    "isExplored": True,
                    "preferenceScore": 0.0,
                    "position": {"x": 0.0, "y": 0.0},
                    "children": ["node_1", "node_2"],
                    "createdAt": "2025-11-23T00:00:00",
                },
                "nodes": [],
            }
        }


class ExpandNodeResponse(BaseModel):
    """Response containing child nodes from expansion."""

    children: list[ConceptNode] = Field(..., description="Child nodes generated from expansion")
    reward: float = Field(..., description="Reward signal (surprise reduction)")
    parent_updated: ConceptNode = Field(
        ..., description="Updated parent node with new isExplored status"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "children": [],
                "reward": 0.73,
                "parent_updated": {
                    "id": "node_1",
                    "label": "Free Energy",
                    "concept": "Free Energy Principle",
                    "isExplored": True,
                    "preferenceScore": 0.2,
                    "position": {"x": 100.0, "y": 200.0},
                    "children": ["node_3", "node_4"],
                    "createdAt": "2025-11-23T00:00:00",
                },
            }
        }


class PreferenceUpdateResponse(BaseModel):
    """Response containing updated node after preference learning."""

    updated_node: ConceptNode = Field(..., description="Node with updated preference score")
    affected_siblings: list[ConceptNode] = Field(
        default_factory=list, description="Sibling nodes with propagated preference boost"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "updated_node": {
                    "id": "node_1",
                    "label": "Free Energy",
                    "concept": "Free Energy Principle",
                    "isExplored": False,
                    "preferenceScore": 0.1,
                    "position": {"x": 100.0, "y": 200.0},
                    "children": [],
                    "createdAt": "2025-11-23T00:00:00",
                },
                "affected_siblings": [],
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Health status")
    timestamp: str = Field(..., description="Current timestamp")
    version: str = Field(..., description="API version")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2025-11-23T00:00:00",
                "version": "0.1.0",
            }
        }


# Trajectory API Models (Phase 11.2)
class TrajectoryEntry(BaseModel):
    """Single trajectory entry (State-Action-Reward tuple)."""

    timestamp: str = Field(..., description="ISO timestamp of the interaction")
    action: dict = Field(..., description="Action taken (type, node_id, etc.)")
    reward: float = Field(..., description="Reward signal (surprise reduction)")
    state_snapshot: dict = Field(..., description="Graph state before action")


class TrajectoryListResponse(BaseModel):
    """List of trajectories for a session."""

    session_id: str = Field(..., description="Session identifier")
    trajectories: list[TrajectoryEntry] = Field(..., description="List of trajectory entries")
    total_count: int = Field(..., description="Total number of trajectories")
    total_reward: float = Field(..., description="Sum of all rewards")
    avg_reward: float = Field(..., description="Average reward per interaction")


class TrajectoryExportFormat(BaseModel):
    """Formatted trajectory for ML training."""

    state: dict = Field(..., description="Graph state representation")
    action: dict = Field(..., description="Action taken")
    reward: float = Field(..., description="Reward signal")
    next_state: Optional[dict] = Field(None, description="State after action")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")


class TrajectoryExportResponse(BaseModel):
    """Export trajectories in ML training format."""

    session_id: str = Field(..., description="Session identifier")
    format: Literal["pytorch", "huggingface", "generic"] = Field(
        "generic", description="Export format"
    )
    trajectories: list[TrajectoryExportFormat] = Field(..., description="Formatted trajectories")
    total_count: int = Field(..., description="Number of trajectories")


class TrajectoryStatsResponse(BaseModel):
    """Statistics about interaction trajectories."""

    session_id: str = Field(..., description="Session identifier")
    total_interactions: int = Field(..., description="Total number of interactions")
    avg_reward_per_action: dict[str, float] = Field(
        ..., description="Average reward by action type"
    )
    surprise_reduction_trend: list[float] = Field(
        ..., description="Surprise reduction over time"
    )
    most_explored_concepts: list[str] = Field(..., description="Most frequently explored concepts")
    exploration_efficiency: float = Field(
        ..., description="Ratio of successful explorations"
    )


# Auto-Expansion API Models (Phase 11.3)
class AutoExpandRequest(BaseModel):
    """Request to autonomously expand the graph."""

    context: MindMapState = Field(..., description="Current graph state")
    max_nodes: int = Field(10, ge=1, le=50, description="Maximum number of nodes to expand")
    strategy: Literal["uncertainty", "preference", "expected_gain"] = Field(
        "uncertainty",
        description="Expansion strategy: uncertainty (high entropy first), preference (high scores), expected_gain (information theory)",
    )
    time_limit: int = Field(
        60, ge=10, le=300, description="Time limit in seconds (10-300)"
    )
    uncertainty_threshold: float = Field(
        0.3,
        ge=0.0,
        le=1.0,
        description="Minimum uncertainty threshold for uncertainty strategy",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "context": {
                    "centerConcept": "Active Inference",
                    "nodes": [],
                    "isGenerating": False,
                    "loadingNodeId": None,
                    "selectedNodeId": None,
                    "infoPanel": None,
                },
                "max_nodes": 10,
                "strategy": "uncertainty",
                "time_limit": 60,
                "uncertainty_threshold": 0.3,
            }
        }


class AutoExpandResponse(BaseModel):
    """Response from autonomous graph expansion."""

    expanded_nodes: list[ConceptNode] = Field(
        ..., description="All new nodes created during auto-expansion"
    )
    expansion_count: int = Field(..., description="Number of successful expansions performed")
    total_reward: float = Field(..., description="Sum of all rewards from expansions")
    avg_reward_per_expansion: float = Field(..., description="Average reward per expansion")
    final_graph_stats: dict = Field(..., description="Graph statistics after expansion")
    stopped_reason: str = Field(
        ...,
        description="Why expansion stopped: completed, time_limit, threshold, no_unexplored_nodes, error",
    )
    elapsed_time: float = Field(..., description="Total time taken in seconds")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "expanded_nodes": [],
                "expansion_count": 10,
                "total_reward": 7.3,
                "avg_reward_per_expansion": 0.73,
                "final_graph_stats": {
                    "total_nodes": 45,
                    "explored_nodes": 15,
                    "unexplored_nodes": 30,
                    "preferred_nodes": 8,
                    "uncertain_nodes": 2,
                    "center_concept": "Active Inference",
                },
                "stopped_reason": "completed",
                "elapsed_time": 45.2,
            }
        }


# AI-Powered Node Recommendation Models (Phase 11.5)
class SuggestNextNodeRequest(BaseModel):
    """Request to get AI-powered node suggestions."""

    context: MindMapState = Field(..., description="Current graph state")
    num_suggestions: int = Field(
        3, ge=1, le=10, description="Number of suggestions to return (1-10)"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "context": {
                    "centerConcept": "Active Inference",
                    "nodes": [],
                    "isGenerating": False,
                    "loadingNodeId": None,
                    "selectedNodeId": None,
                    "infoPanel": None,
                },
                "num_suggestions": 3,
            }
        }


class NodeSuggestion(BaseModel):
    """Individual node suggestion with reasoning."""

    node: ConceptNode = Field(..., description="The suggested node")
    reasoning: str = Field(..., description="Why this node is suggested")
    expected_information_gain: float = Field(
        ..., description="Expected information gain from exploring this node"
    )
    current_uncertainty: float = Field(
        ..., description="Current epistemic uncertainty of this node"
    )
    relevance_score: float = Field(
        ..., description="Relevance to center concept (1 - divergence)"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in this suggestion (0-1)"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "node": {
                    "id": "node_3",
                    "label": "Variational Inference",
                    "concept": "Variational Inference in Machine Learning",
                    "isExplored": False,
                    "preferenceScore": 0.15,
                    "position": {"x": 150.0, "y": 250.0},
                    "children": [],
                    "createdAt": "2025-11-23T00:00:00",
                },
                "reasoning": "This node has high uncertainty (0.78) and is highly relevant to your topic (relevance: 0.82). Exploring it could reduce 0.64 bits of surprise.",
                "expected_information_gain": 0.64,
                "current_uncertainty": 0.78,
                "relevance_score": 0.82,
                "confidence": 0.87,
            }
        }


class SuggestNextNodeResponse(BaseModel):
    """Response containing AI-powered node suggestions."""

    suggestions: list[NodeSuggestion] = Field(
        ..., description="List of suggested nodes with reasoning"
    )
    total_unexplored: int = Field(..., description="Total number of unexplored nodes")
    strategy_used: str = Field(..., description="Strategy used for suggestions")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "suggestions": [],
                "total_unexplored": 12,
                "strategy_used": "expected_information_gain",
            }
        }


# Graph Analytics Dashboard Models (Phase 11.6)
class RewardHistoryEntry(BaseModel):
    """Single entry in reward history."""

    timestamp: str = Field(..., description="ISO timestamp")
    reward: float = Field(..., description="Reward value")
    action_type: str = Field(..., description="Type of action that generated reward")


class GraphAnalyticsResponse(BaseModel):
    """Analytics data for graph visualization dashboard."""

    # Basic counts
    total_nodes: int = Field(..., description="Total number of nodes in graph")
    explored_nodes: int = Field(..., description="Number of explored nodes (solid border)")
    unexplored_nodes: int = Field(..., description="Number of unexplored nodes (dashed border)")

    # Preference categorization
    preferred_nodes: int = Field(
        ..., description="Nodes with preference score > 0.3 (green tint)"
    )
    uncertain_nodes: int = Field(
        ..., description="Nodes with preference score < -0.2 (orange tint)"
    )
    neutral_nodes: int = Field(
        ..., description="Nodes with preference score between -0.2 and 0.3"
    )

    # Layer-based metrics
    avg_uncertainty_by_layer: dict[str, float] = Field(
        ..., description="Average uncertainty score for each layer (Layer 0, Layer 1, etc.)"
    )
    nodes_by_layer: dict[str, int] = Field(
        ..., description="Number of nodes in each layer"
    )

    # Preference distribution
    preference_distribution: dict[str, int] = Field(
        ..., description="Count of nodes in each preference category"
    )

    # Exploration metrics
    exploration_rate: float = Field(
        ..., ge=0.0, le=1.0, description="Ratio of explored nodes to total nodes"
    )

    # Reward history (if trajectory data available)
    reward_history: list[RewardHistoryEntry] = Field(
        default_factory=list, description="Historical reward data over time"
    )

    # Surprise reduction trend
    surprise_reduction_trend: list[float] = Field(
        default_factory=list, description="Cumulative surprise reduction over time"
    )

    # Metadata
    center_concept: str = Field(..., description="The central topic of the graph")
    session_id: Optional[str] = Field(None, description="Session identifier if available")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "total_nodes": 45,
                "explored_nodes": 18,
                "unexplored_nodes": 27,
                "preferred_nodes": 12,
                "uncertain_nodes": 3,
                "neutral_nodes": 30,
                "avg_uncertainty_by_layer": {
                    "Layer 0": 0.0,
                    "Layer 1": 0.65,
                    "Layer 2": 0.72,
                },
                "nodes_by_layer": {
                    "Layer 0": 1,
                    "Layer 1": 5,
                    "Layer 2": 20,
                    "Layer 3": 19,
                },
                "preference_distribution": {
                    "preferred": 12,
                    "uncertain": 3,
                    "neutral": 30,
                },
                "exploration_rate": 0.40,
                "reward_history": [],
                "surprise_reduction_trend": [],
                "center_concept": "Active Inference",
                "session_id": None,
            }
        }


# Multimedia Generation API Models (Phase 11.8 - Minimax Integration)
class GenerateMediaRequest(BaseModel):
    """Request to generate multimedia content (image or video) for a concept node."""

    node_id: str = Field(..., description="ID of the node to generate media for")
    media_type: Literal["image", "video"] = Field(..., description="Type of media to generate")
    prompt_override: Optional[str] = Field(
        None,
        description="Optional custom prompt (if not provided, uses node's concept text)",
    )

    # Image-specific parameters
    aspect_ratio: str = Field("1:1", description="Image aspect ratio (e.g., '1:1', '16:9', '9:16')")

    # Video-specific parameters
    duration: int = Field(6, ge=6, le=10, description="Video duration in seconds (6 or 10)")
    resolution: Literal["768P", "1080P"] = Field("768P", description="Video resolution")

    # Generation options
    wait_for_completion: bool = Field(
        False,
        description="If True, waits for generation to complete before returning. If False, returns task_id immediately",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "node_id": "node_1",
                "media_type": "video",
                "prompt_override": None,
                "aspect_ratio": "16:9",
                "duration": 6,
                "resolution": "768P",
                "wait_for_completion": False,
            }
        }


class GenerateMediaResponse(BaseModel):
    """Response from media generation request."""

    node_id: str = Field(..., description="ID of the node")
    media_type: Literal["image", "video"] = Field(..., description="Type of media generated")
    status: Literal["pending", "generating", "completed", "failed", "timeout"] = Field(
        ..., description="Current status of media generation"
    )

    # Task ID for async polling
    task_id: Optional[str] = Field(None, description="Task ID for checking status (if async)")

    # Media URLs (if completed)
    media_url: Optional[str] = Field(None, description="URL of generated media (if completed)")

    # Error information
    error: Optional[str] = Field(None, description="Error message (if failed)")

    # Timing information
    elapsed_time: Optional[float] = Field(None, description="Time elapsed in seconds (if completed or failed)")

    # Updated node with media URL in metadata
    updated_node: Optional[ConceptNode] = Field(
        None, description="Updated node with media URL in metadata (if completed)"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "node_id": "node_1",
                "media_type": "video",
                "status": "pending",
                "task_id": "task_abc123",
                "media_url": None,
                "error": None,
                "elapsed_time": None,
                "updated_node": None,
            }
        }


class CheckMediaStatusRequest(BaseModel):
    """Request to check the status of a media generation task."""

    task_id: str = Field(..., description="Task ID from GenerateMediaResponse")
    media_type: Literal["image", "video"] = Field(..., description="Type of media being generated")
    node_id: str = Field(..., description="ID of the node")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "task_id": "task_abc123",
                "media_type": "video",
                "node_id": "node_1",
            }
        }


class CheckMediaStatusResponse(BaseModel):
    """Response with current status of media generation task."""

    task_id: str = Field(..., description="Task ID")
    node_id: str = Field(..., description="ID of the node")
    media_type: Literal["image", "video"] = Field(..., description="Type of media")
    status: Literal["pending", "queued", "generating", "completed", "failed"] = Field(
        ..., description="Current status"
    )

    # Media URL (if completed)
    media_url: Optional[str] = Field(None, description="URL of generated media (if completed)")

    # Progress information
    progress: Optional[int] = Field(
        None, ge=0, le=100, description="Progress percentage (0-100, if available)"
    )

    # Error information
    error: Optional[str] = Field(None, description="Error message (if failed)")

    # Updated node (if completed)
    updated_node: Optional[ConceptNode] = Field(
        None, description="Updated node with media URL in metadata (if completed)"
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "task_id": "task_abc123",
                "node_id": "node_1",
                "media_type": "video",
                "status": "generating",
                "media_url": None,
                "progress": 45,
                "error": None,
                "updated_node": None,
            }
        }
