"""Pydantic models for ConceptNode and related data structures."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NodeMetadata(BaseModel):
    """Metadata associated with a concept node."""

    sources: list[str] = Field(default_factory=list, description="URLs or references")
    keywords: list[str] = Field(default_factory=list, description="Related keywords")
    summary: Optional[str] = Field(None, description="Brief summary of the concept")
    uncertainty_score: float = Field(
        1.0, ge=0.0, le=1.0, description="Uncertainty score (0.0 = certain, 1.0 = uncertain)"
    )


class ConceptNodeBase(BaseModel):
    """Base concept node with core fields."""

    label: str = Field(..., description="Short display label for the node")
    concept: str = Field(..., description="Full concept text")
    metadata: Optional[NodeMetadata] = Field(None, description="Additional metadata")


class ConceptNode(ConceptNodeBase):
    """Full concept node with all fields including state and relationships."""

    id: str = Field(..., description="Unique identifier for the node")
    isExplored: bool = Field(False, description="False = dashed border, True = solid border")
    preferenceScore: float = Field(
        0.0, ge=-1.0, le=1.0, description="Preference score (-1.0 to 1.0, starts at 0.0)"
    )
    position: dict[str, float] = Field(
        ..., description="Position coordinates {x: float, y: float}"
    )
    parentId: Optional[str] = Field(None, description="Parent node ID for tree relationships")
    children: list[str] = Field(default_factory=list, description="List of child node IDs")
    createdAt: datetime = Field(default_factory=datetime.now, description="Creation timestamp")

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "id": "node_1",
                "label": "Active Inference",
                "concept": "A framework for understanding perception and action",
                "isExplored": False,
                "preferenceScore": 0.0,
                "position": {"x": 100.0, "y": 200.0},
                "parentId": None,
                "children": ["node_2", "node_3"],
                "createdAt": "2025-11-23T00:00:00",
                "metadata": {
                    "sources": ["https://example.com/active-inference"],
                    "keywords": ["neuroscience", "prediction", "bayesian"],
                    "summary": "Active Inference is a theory of brain function",
                    "uncertainty_score": 0.3,
                },
            }
        }
