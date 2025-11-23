"""Pydantic models for the Surreal backend."""

from app.models.graph import GraphSnapshot, InfoPanel, MindMapState
from app.models.node import ConceptNode, ConceptNodeBase, NodeMetadata
from app.models.requests import (
    AutoExpandRequest,
    AutoExpandResponse,
    ExpandNodeRequest,
    ExpandNodeResponse,
    GraphAnalyticsResponse,
    HealthResponse,
    InitTopicRequest,
    InitTopicResponse,
    NodeSuggestion,
    PreferenceUpdateRequest,
    PreferenceUpdateResponse,
    RewardHistoryEntry,
    SuggestNextNodeRequest,
    SuggestNextNodeResponse,
    TrajectoryEntry,
    TrajectoryExportFormat,
    TrajectoryExportResponse,
    TrajectoryListResponse,
    TrajectoryStatsResponse,
)

__all__ = [
    # Node models
    "NodeMetadata",
    "ConceptNodeBase",
    "ConceptNode",
    # Graph models
    "InfoPanel",
    "MindMapState",
    "GraphSnapshot",
    # Request models
    "InitTopicRequest",
    "ExpandNodeRequest",
    "PreferenceUpdateRequest",
    "AutoExpandRequest",
    "SuggestNextNodeRequest",
    # Response models
    "InitTopicResponse",
    "ExpandNodeResponse",
    "PreferenceUpdateResponse",
    "HealthResponse",
    "AutoExpandResponse",
    "SuggestNextNodeResponse",
    # Trajectory models
    "TrajectoryEntry",
    "TrajectoryListResponse",
    "TrajectoryExportFormat",
    "TrajectoryExportResponse",
    "TrajectoryStatsResponse",
    # Helper models
    "NodeSuggestion",
    "RewardHistoryEntry",
    # Analytics models
    "GraphAnalyticsResponse",
]
