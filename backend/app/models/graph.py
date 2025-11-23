"""Pydantic models for graph state and snapshots."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.node import ConceptNode


class InfoPanel(BaseModel):
    """Info panel state for displaying node details."""

    nodeId: str = Field(..., description="ID of the node to display")
    position: dict[str, float] = Field(..., description="Position {x: float, y: float}")


class MindMapState(BaseModel):
    """Complete state of the knowledge graph/mind map."""

    centerConcept: str = Field(..., description="User's initial topic/goal")
    nodes: list[ConceptNode] = Field(default_factory=list, description="All nodes in the graph")
    isGenerating: bool = Field(False, description="Global loading state")
    loadingNodeId: Optional[str] = Field(None, description="ID of node currently being expanded")
    selectedNodeId: Optional[str] = Field(None, description="Currently selected node ID")
    infoPanel: Optional[InfoPanel] = Field(None, description="Info panel state (right-click)")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "centerConcept": "Active Inference in AI",
                "nodes": [],
                "isGenerating": False,
                "loadingNodeId": None,
                "selectedNodeId": None,
                "infoPanel": None,
            }
        }


class GraphSnapshot(BaseModel):
    """Snapshot of graph state for trajectory storage (RL training data)."""

    sessionId: str = Field(..., description="Session identifier")
    timestamp: datetime = Field(default_factory=datetime.now, description="Snapshot timestamp")
    state: MindMapState = Field(..., description="Complete graph state")
    action: Optional[dict] = Field(None, description="Action that led to this state")
    reward: Optional[float] = Field(None, description="Reward signal (surprise reduction)")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "sessionId": "session_123",
                "timestamp": "2025-11-23T00:00:00",
                "state": {
                    "centerConcept": "Active Inference",
                    "nodes": [],
                    "isGenerating": False,
                    "loadingNodeId": None,
                    "selectedNodeId": None,
                    "infoPanel": None,
                },
                "action": {"type": "expand_node", "node_id": "node_1"},
                "reward": 0.73,
            }
        }
