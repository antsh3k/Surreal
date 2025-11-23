"""Pydantic models for the Surreal backend."""

from app.models.graph import GraphSnapshot, InfoPanel, MindMapState
from app.models.node import ConceptNode, ConceptNodeBase, NodeMetadata
from app.models.requests import (
    AutoExpandRequest,
    AutoExpandResponse,
    CheckMediaStatusRequest,
    CheckMediaStatusResponse,
    ExpandNodeRequest,
    ExpandNodeResponse,
    GenerateMediaRequest,
    GenerateMediaResponse,
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
    "GenerateMediaRequest",
    "CheckMediaStatusRequest",
    # Response models
    "InitTopicResponse",
    "ExpandNodeResponse",
    "PreferenceUpdateResponse",
    "HealthResponse",
    "AutoExpandResponse",
    "SuggestNextNodeResponse",
    "GenerateMediaResponse",
    "CheckMediaStatusResponse",
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
