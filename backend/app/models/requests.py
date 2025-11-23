"""Pydantic models for API requests and responses."""

from typing import Literal

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
