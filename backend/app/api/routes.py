"""API routes for the Surreal backend."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.models import (
    ExpandNodeRequest,
    ExpandNodeResponse,
    HealthResponse,
    InitTopicRequest,
    InitTopicResponse,
    PreferenceUpdateRequest,
    PreferenceUpdateResponse,
)
from app.services import GraphService
from app.utils import log_api_call, logger

# Create API router
router = APIRouter(prefix="/api", tags=["api"])

# Initialize services (singleton instances)
graph_service = GraphService()


@router.post("/init", response_model=InitTopicResponse, status_code=status.HTTP_200_OK)
async def initialize_topic(request: InitTopicRequest) -> InitTopicResponse:
    """
    Initialize a new knowledge graph from a topic.

    Generates:
    - Center node (the "Self Node")
    - Layer 1 nodes (4-5 initial concepts)

    Time target: < 2 seconds
    """
    log_api_call("/api/init", topic=request.topic)

    try:
        # Create initial graph
        graph = await graph_service.create_initial_graph(request.topic)

        # Extract center node and other nodes
        center_node = graph.nodes[0]  # First node is center
        layer1_nodes = graph.nodes[1:]  # Rest are Layer 1

        return InitTopicResponse(centerNode=center_node, nodes=layer1_nodes)

    except Exception as e:
        logger.error(f"Error initializing topic: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize topic: {str(e)}",
        )


@router.post("/expand", response_model=ExpandNodeResponse, status_code=status.HTTP_200_OK)
async def expand_node(request: ExpandNodeRequest) -> ExpandNodeResponse:
    """
    Expand a node and generate child concepts.

    This triggers:
    1. Uncertainty calculation (Free Energy)
    2. Search for grounding (if uncertain)
    3. Concept generation (Gemini)
    4. Child validation
    5. Reward calculation

    Time target: < 3 seconds
    """
    log_api_call("/api/expand", node_id=request.node_id)

    try:
        # Expand the node
        result = await graph_service.expand_node(request.node_id, request.context)

        if result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"],
            )

        return ExpandNodeResponse(
            children=result["children"],
            reward=result["reward"],
            parent_updated=result["parent_updated"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error expanding node: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to expand node: {str(e)}",
        )


@router.post(
    "/preference", response_model=PreferenceUpdateResponse, status_code=status.HTTP_200_OK
)
async def update_preference(request: PreferenceUpdateRequest) -> PreferenceUpdateResponse:
    """
    Update preference scores based on user interaction.

    This implements preference learning:
    - Hover: +0.02
    - Click: +0.1
    - Expand: +0.2
    - Sibling propagation: +0.1

    Time target: < 100ms
    """
    log_api_call("/api/preference", node_id=request.node_id, action=request.action)

    try:
        # Update preferences
        result = graph_service.update_preferences(
            request.node_id, request.action, request.context
        )

        if result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=result["error"]
            )

        return PreferenceUpdateResponse(
            updated_node=result["updated_node"],
            affected_siblings=result["affected_siblings"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating preference: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preference: {str(e)}",
        )


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns:
        Health status, timestamp, and API version
    """
    return HealthResponse(
        status="healthy", timestamp=datetime.now().isoformat(), version="0.1.0"
    )


# Stretch goal endpoints (not fully implemented)
@router.get("/graph/{session_id}")
async def get_graph(session_id: str) -> dict:
    """
    Retrieve a saved graph (stretch goal).

    Requires MongoDB to be configured and connected.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Graph persistence not yet implemented. Configure MongoDB to enable this feature.",
    )


@router.post("/export")
async def export_graph(request: dict) -> dict:
    """
    Export graph data (stretch goal).

    Returns the full graph structure as JSON.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Graph export not yet implemented.",
    )
