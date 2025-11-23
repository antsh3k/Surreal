"""API routes for the Surreal backend."""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app.models import (
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
    TrajectoryExportResponse,
    TrajectoryListResponse,
    TrajectoryStatsResponse,
)
from app.services import GraphService, minimax_service
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


@router.post(
    "/auto-expand", response_model=AutoExpandResponse, status_code=status.HTTP_200_OK
)
async def auto_expand_graph(request: AutoExpandRequest) -> AutoExpandResponse:
    """
    Autonomously expand the graph using AI-driven exploration.

    This endpoint demonstrates the system working as a true RL agent without human input.
    It autonomously selects and expands nodes based on the chosen strategy, generating
    State-Action-Reward trajectories that can be used for post-training.

    Strategies:
    - uncertainty: Expand nodes with highest epistemic uncertainty (recommended)
    - preference: Expand nodes with highest preference scores
    - expected_gain: Expand nodes with highest expected information gain

    Time estimate: Variable based on max_nodes and time_limit
    """
    log_api_call(
        "/api/auto-expand",
        strategy=request.strategy,
        max_nodes=request.max_nodes,
        time_limit=request.time_limit,
    )

    try:
        # Run auto-expansion
        result = await graph_service.auto_expand_graph(
            graph=request.context,
            max_nodes=request.max_nodes,
            strategy=request.strategy,
            time_limit=request.time_limit,
            uncertainty_threshold=request.uncertainty_threshold,
        )

        if result.get("error"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"],
            )

        return AutoExpandResponse(
            expanded_nodes=result["expanded_nodes"],
            expansion_count=result["expansion_count"],
            total_reward=result["total_reward"],
            avg_reward_per_expansion=result["avg_reward_per_expansion"],
            final_graph_stats=result["final_graph_stats"],
            stopped_reason=result["stopped_reason"],
            elapsed_time=result["elapsed_time"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during auto-expansion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-expand graph: {str(e)}",
        )


@router.post(
    "/suggest-next", response_model=SuggestNextNodeResponse, status_code=status.HTTP_200_OK
)
async def suggest_next_nodes(request: SuggestNextNodeRequest) -> SuggestNextNodeResponse:
    """
    Get AI-powered suggestions for which nodes to explore next.

    This endpoint analyzes unexplored nodes and suggests the most promising ones
    based on expected information gain, uncertainty, and relevance to the center concept.

    Returns up to num_suggestions nodes with detailed reasoning for each.

    Time estimate: < 500ms
    """
    from app.core.free_energy import (
        calculate_entropy,
        calculate_expected_information_gain,
        calculate_divergence,
    )

    log_api_call("/api/suggest-next", num_suggestions=request.num_suggestions)

    try:
        # Filter unexplored nodes
        unexplored_nodes = [
            node for node in request.context.nodes if not node.isExplored and node.id != "center"
        ]

        if not unexplored_nodes:
            return SuggestNextNodeResponse(
                suggestions=[],
                total_unexplored=0,
                strategy_used="expected_information_gain",
            )

        # Calculate scores for each unexplored node
        scored_nodes = []
        for node in unexplored_nodes:
            # Calculate metrics
            uncertainty = calculate_entropy(node)
            expected_gain = await calculate_expected_information_gain(
                node, request.context
            )
            divergence = await calculate_divergence(node, request.context.centerConcept)
            relevance = 1.0 - divergence

            # Combined score: prioritize expected information gain
            combined_score = (
                expected_gain * 0.6  # Weight information gain heavily
                + uncertainty * 0.2  # Consider uncertainty
                + relevance * 0.1  # Slight preference for relevant nodes
                + (node.preferenceScore + 1.0) * 0.1  # Consider preference (scaled to 0-2)
            )

            scored_nodes.append(
                {
                    "node": node,
                    "expected_gain": expected_gain,
                    "uncertainty": uncertainty,
                    "relevance": relevance,
                    "combined_score": combined_score,
                }
            )

        # Sort by combined score (highest first)
        scored_nodes.sort(key=lambda x: x["combined_score"], reverse=True)

        # Select top N suggestions
        top_suggestions = scored_nodes[: request.num_suggestions]

        # Generate reasoning for each suggestion
        suggestions = []
        for i, item in enumerate(top_suggestions):
            node = item["node"]
            expected_gain = item["expected_gain"]
            uncertainty = item["uncertainty"]
            relevance = item["relevance"]

            # Generate natural language reasoning
            reasoning_parts = []

            # Lead with the strongest factor
            if expected_gain > 0.6:
                reasoning_parts.append(
                    f"High expected information gain ({expected_gain:.2f})"
                )
            elif uncertainty > 0.7:
                reasoning_parts.append(f"High uncertainty ({uncertainty:.2f})")
            elif relevance > 0.8:
                reasoning_parts.append(f"Highly relevant to your topic ({relevance:.2f})")

            # Add supporting factors
            if uncertainty > 0.5 and expected_gain > 0.4:
                reasoning_parts.append(
                    f"exploring could reduce {expected_gain:.2f} bits of surprise"
                )

            if relevance > 0.6:
                reasoning_parts.append(f"closely related to '{request.context.centerConcept}'")

            if node.preferenceScore > 0.2:
                reasoning_parts.append(
                    f"matches your interests (preference: {node.preferenceScore:.2f})"
                )

            # Combine reasoning
            if len(reasoning_parts) >= 2:
                reasoning = f"{reasoning_parts[0]}, {' and '.join(reasoning_parts[1:])}"
            elif reasoning_parts:
                reasoning = reasoning_parts[0]
            else:
                reasoning = "Promising node to explore based on Active Inference metrics"

            # Capitalize first letter
            reasoning = reasoning[0].upper() + reasoning[1:] + "."

            # Calculate confidence (normalized combined score)
            max_possible_score = 1.0  # Theoretical maximum
            confidence = min(item["combined_score"] / max_possible_score, 1.0)

            suggestion = NodeSuggestion(
                node=node,
                reasoning=reasoning,
                expected_information_gain=expected_gain,
                current_uncertainty=uncertainty,
                relevance_score=relevance,
                confidence=confidence,
            )
            suggestions.append(suggestion)

        logger.info(
            f"Generated {len(suggestions)} node suggestions from {len(unexplored_nodes)} unexplored nodes"
        )

        return SuggestNextNodeResponse(
            suggestions=suggestions,
            total_unexplored=len(unexplored_nodes),
            strategy_used="expected_information_gain",
        )

    except Exception as e:
        logger.error(f"Error generating node suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate node suggestions: {str(e)}",
        )


@router.post(
    "/analytics", response_model=GraphAnalyticsResponse, status_code=status.HTTP_200_OK
)
async def get_graph_analytics(request: dict) -> GraphAnalyticsResponse:
    """
    Get comprehensive analytics for the graph.

    Provides metrics for visualization dashboards:
    - Node counts by exploration status
    - Preference score distributions
    - Uncertainty by layer
    - Exploration efficiency
    - Reward history (if session_id provided and trajectories exist)

    Time estimate: < 200ms (< 500ms if trajectory data included)
    """
    from app.models.graph import MindMapState
    from app.services import StorageService

    log_api_call("/api/analytics")

    try:
        # Parse graph state from request
        context = MindMapState(**request.get("context", {}))
        session_id = request.get("session_id")

        # Get analytics from graph service
        analytics = graph_service.get_graph_analytics(context, session_id)

        # If session_id provided, try to fetch trajectory data
        reward_history = []
        surprise_reduction_trend = []

        if session_id:
            try:
                storage = StorageService()
                await storage.connect()

                trajectories = await storage.get_trajectories(session_id)

                if trajectories:
                    # Build reward history
                    for traj in trajectories:
                        if traj.reward is not None:
                            reward_history.append(
                                RewardHistoryEntry(
                                    timestamp=traj.timestamp.isoformat(),
                                    reward=traj.reward,
                                    action_type=traj.action.get("type", "unknown")
                                    if traj.action
                                    else "unknown",
                                )
                            )

                    # Calculate cumulative surprise reduction
                    cumulative = 0.0
                    for traj in trajectories:
                        if traj.reward is not None:
                            cumulative += traj.reward
                            surprise_reduction_trend.append(cumulative)

                await storage.disconnect()

            except Exception as e:
                logger.warning(
                    f"Failed to fetch trajectory data for session {session_id}: {str(e)}"
                )
                # Continue without trajectory data

        logger.info(
            f"Generated analytics: {analytics['total_nodes']} nodes, "
            f"{analytics['exploration_rate']:.2%} explored"
        )

        return GraphAnalyticsResponse(
            total_nodes=analytics["total_nodes"],
            explored_nodes=analytics["explored_nodes"],
            unexplored_nodes=analytics["unexplored_nodes"],
            preferred_nodes=analytics["preferred_nodes"],
            uncertain_nodes=analytics["uncertain_nodes"],
            neutral_nodes=analytics["neutral_nodes"],
            avg_uncertainty_by_layer=analytics["avg_uncertainty_by_layer"],
            nodes_by_layer=analytics["nodes_by_layer"],
            preference_distribution=analytics["preference_distribution"],
            exploration_rate=analytics["exploration_rate"],
            reward_history=reward_history,
            surprise_reduction_trend=surprise_reduction_trend,
            center_concept=analytics["center_concept"],
            session_id=session_id,
        )

    except Exception as e:
        logger.error(f"Error generating graph analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate graph analytics: {str(e)}",
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


# Trajectory API Endpoints (Phase 11.2)
@router.get(
    "/trajectories/{session_id}",
    response_model=TrajectoryListResponse,
    status_code=status.HTTP_200_OK,
)
async def get_trajectories(session_id: str) -> TrajectoryListResponse:
    """
    Get all interaction trajectories for a session.

    This endpoint exposes the State-Action-Reward tuples generated during
    user interaction - the core RL training data.

    Args:
        session_id: Session identifier

    Returns:
        List of trajectory entries with statistics
    """
    from app.services import StorageService

    log_api_call("/api/trajectories", session_id=session_id)

    try:
        storage = StorageService()
        await storage.connect()

        # Get trajectories from storage
        trajectories_data = await storage.get_trajectories(session_id)

        if not trajectories_data:
            return TrajectoryListResponse(
                session_id=session_id,
                trajectories=[],
                total_count=0,
                total_reward=0.0,
                avg_reward=0.0,
            )

        # Convert to response format
        entries = []
        total_reward = 0.0
        for traj in trajectories_data:
            entry = TrajectoryEntry(
                timestamp=traj.timestamp.isoformat(),
                action=traj.action or {},
                reward=traj.reward or 0.0,
                state_snapshot=traj.state.model_dump(),
            )
            entries.append(entry)
            total_reward += traj.reward or 0.0

        avg_reward = total_reward / len(entries) if entries else 0.0

        await storage.disconnect()

        return TrajectoryListResponse(
            session_id=session_id,
            trajectories=entries,
            total_count=len(entries),
            total_reward=total_reward,
            avg_reward=avg_reward,
        )

    except Exception as e:
        logger.error(f"Error retrieving trajectories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve trajectories: {str(e)}",
        )


@router.get(
    "/trajectories/{session_id}/export",
    response_model=TrajectoryExportResponse,
    status_code=status.HTTP_200_OK,
)
async def export_trajectories(
    session_id: str, format: str = "generic"
) -> TrajectoryExportResponse:
    """
    Export trajectories in ML training format.

    Formats the State-Action-Reward data for use in post-training pipelines.

    Args:
        session_id: Session identifier
        format: Export format (generic, pytorch, huggingface)

    Returns:
        Formatted trajectories ready for ML training
    """
    from app.services import StorageService

    log_api_call("/api/trajectories/export", session_id=session_id, format=format)

    try:
        storage = StorageService()
        await storage.connect()

        # Get trajectories
        trajectories_data = await storage.get_trajectories(session_id)

        if not trajectories_data:
            await storage.disconnect()
            return TrajectoryExportResponse(
                session_id=session_id,
                format=format,  # type: ignore
                trajectories=[],
                total_count=0,
            )

        # Format for ML training
        formatted = []
        for i, traj in enumerate(trajectories_data):
            next_state = None
            if i < len(trajectories_data) - 1:
                next_state = trajectories_data[i + 1].state.model_dump()

            formatted_traj = TrajectoryExportFormat(
                state=traj.state.model_dump(),
                action=traj.action or {},
                reward=traj.reward or 0.0,
                next_state=next_state,
                metadata={
                    "timestamp": traj.timestamp.isoformat(),
                    "session_id": session_id,
                },
            )
            formatted.append(formatted_traj)

        await storage.disconnect()

        return TrajectoryExportResponse(
            session_id=session_id,
            format=format,  # type: ignore
            trajectories=formatted,
            total_count=len(formatted),
        )

    except Exception as e:
        logger.error(f"Error exporting trajectories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export trajectories: {str(e)}",
        )


@router.get(
    "/trajectories/{session_id}/stats",
    response_model=TrajectoryStatsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_trajectory_stats(session_id: str) -> TrajectoryStatsResponse:
    """
    Get statistics about interaction trajectories.

    Provides aggregate metrics showing learning patterns and efficiency.

    Args:
        session_id: Session identifier

    Returns:
        Trajectory statistics and trends
    """
    from app.services import StorageService

    log_api_call("/api/trajectories/stats", session_id=session_id)

    try:
        storage = StorageService()
        await storage.connect()

        trajectories_data = await storage.get_trajectories(session_id)

        if not trajectories_data:
            await storage.disconnect()
            return TrajectoryStatsResponse(
                session_id=session_id,
                total_interactions=0,
                avg_reward_per_action={},
                surprise_reduction_trend=[],
                most_explored_concepts=[],
                exploration_efficiency=0.0,
            )

        # Calculate statistics
        total_interactions = len(trajectories_data)

        # Average reward by action type
        action_rewards: dict[str, list[float]] = {}
        for traj in trajectories_data:
            action_type = traj.action.get("type", "unknown") if traj.action else "unknown"
            if action_type not in action_rewards:
                action_rewards[action_type] = []
            action_rewards[action_type].append(traj.reward or 0.0)

        avg_reward_per_action = {
            action: sum(rewards) / len(rewards) for action, rewards in action_rewards.items()
        }

        # Surprise reduction trend (rewards over time)
        surprise_reduction_trend = [traj.reward or 0.0 for traj in trajectories_data]

        # Most explored concepts (with actual concept names, not just IDs)
        concept_counts: dict[str, int] = {}
        concept_names: dict[str, str] = {}  # Map node_id to concept name

        for traj in trajectories_data:
            if traj.action and "node_id" in traj.action:
                node_id = traj.action["node_id"]

                # Try to get the concept name from the state snapshot
                if traj.state and traj.state.nodes:
                    for node in traj.state.nodes:
                        if node.id == node_id:
                            concept_name = node.concept[:50]  # Truncate long concepts
                            concept_names[node_id] = concept_name
                            concept_counts[concept_name] = concept_counts.get(concept_name, 0) + 1
                            break
                else:
                    # Fallback to node_id if concept name not found
                    concept_counts[node_id] = concept_counts.get(node_id, 0) + 1

        most_explored_concepts = sorted(concept_counts.keys(), key=concept_counts.get, reverse=True)[:5]  # type: ignore

        # Exploration efficiency (positive rewards / total)
        positive_rewards = sum(1 for traj in trajectories_data if (traj.reward or 0.0) > 0)
        exploration_efficiency = positive_rewards / total_interactions if total_interactions > 0 else 0.0

        await storage.disconnect()

        return TrajectoryStatsResponse(
            session_id=session_id,
            total_interactions=total_interactions,
            avg_reward_per_action=avg_reward_per_action,
            surprise_reduction_trend=surprise_reduction_trend,
            most_explored_concepts=most_explored_concepts,
            exploration_efficiency=exploration_efficiency,
        )

    except Exception as e:
        logger.error(f"Error calculating trajectory stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate trajectory stats: {str(e)}",
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


# Multimedia Generation Endpoints (Phase 11.8 - Minimax Integration)
@router.post("/generate-media", response_model=GenerateMediaResponse, status_code=status.HTTP_200_OK)
async def generate_media(request: GenerateMediaRequest) -> GenerateMediaResponse:
    """
    Generate multimedia content (image or video) for a concept node.

    **On-demand only**: This endpoint is called when the user explicitly requests
    media generation for a node (e.g., clicks on an explored node to generate content).

    **Image generation (SYNCHRONOUS)**:
    - Images are generated synchronously and returned immediately
    - No task_id is returned (images are ready in the response)
    - Status is always "completed" if successful
    - Typical time: 30-60 seconds

    **Video generation (ASYNCHRONOUS)**:
    - Videos are generated asynchronously
    - Returns task_id for polling via /media-status
    - If `wait_for_completion=False` (default): Returns task_id immediately
    - If `wait_for_completion=True`: Waits for completion (may take 4-10 minutes)

    **Time estimates**:
    - Image generation: ~30-60 seconds (synchronous)
    - Video (6s): ~4-5 minutes (async, requires polling)
    - Video (10s): ~8-9 minutes (async, requires polling)
    """
    log_api_call("/api/generate-media", node_id=request.node_id, media_type=request.media_type)

    try:
        # Get the node from the graph (in a real app, you'd fetch this from storage)
        # For MVP, we'll use the prompt_override if provided, otherwise use a placeholder
        prompt = request.prompt_override or f"Visual representation of: {request.node_id}"

        # Log generation request
        logger.info(
            f"Generating {request.media_type} for node {request.node_id} "
            f"(wait_for_completion={request.wait_for_completion})"
        )

        if request.media_type == "image":
            # Image generation is SYNCHRONOUS (unlike videos)
            # It returns images directly, not a task_id for polling
            result = await minimax_service.generate_image(
                prompt=prompt,
                aspect_ratio=request.aspect_ratio,
                response_format="url",  # Use URL format for direct access
            )

            logger.info(f"Image generation service returned: {result}")

            if result and "error" not in result:
                images = result.get("images", [])
                if images:
                    # Images are generated synchronously, so they're already completed
                    logger.info(f"Image generation successful for node {request.node_id}: {images[0]}")
                    return GenerateMediaResponse(
                        node_id=request.node_id,
                        media_type="image",
                        status="completed",
                        task_id=None,  # No task_id for synchronous operations
                        media_url=images[0],  # Return first image URL
                        error=None,
                        elapsed_time=None,
                        updated_node=None,
                    )
            
            # Handle error with detailed diagnostics
            error_msg = result.get("error", "Failed to generate image") if result else "No response from service"
            error_type = result.get("error_type", "unknown") if result else "no_response"
            diagnostic = result.get("diagnostic", {}) if result else {}
            
            # Build comprehensive error message
            detailed_error = error_msg
            
            # Add HTTP status code if available
            if result and "status_code" in result:
                http_status = result["status_code"]
                detailed_error = f"[HTTP {http_status}] {error_msg}"
            
            # Add diagnostic information to error message for user visibility
            diagnostic_parts = []
            if diagnostic:
                if "api_status_code" in diagnostic:
                    diagnostic_parts.append(f"API Status: {diagnostic['api_status_code']}")
                if "api_status_msg" in diagnostic:
                    diagnostic_parts.append(f"Message: {diagnostic['api_status_msg']}")
                if "api_key_configured" in diagnostic and not diagnostic.get("api_key_configured"):
                    diagnostic_parts.append("⚠️ API key not configured")
                if "endpoint" in diagnostic:
                    diagnostic_parts.append(f"Endpoint: {diagnostic['endpoint']}")
            
            if diagnostic_parts:
                detailed_error = f"{detailed_error} ({'; '.join(diagnostic_parts)})"
            
            # Log full diagnostic information
            logger.error(
                f"Image generation failed for node {request.node_id} - "
                f"Error: {error_msg}, Type: {error_type}, "
                f"Full diagnostic: {diagnostic}"
            )
            
            return GenerateMediaResponse(
                node_id=request.node_id,
                media_type="image",
                status="failed",
                task_id=None,
                media_url=None,
                error=detailed_error,
                elapsed_time=None,
                updated_node=None,
            )

        elif request.media_type == "video":
            if request.wait_for_completion:
                # Generate and wait for completion
                media_url = await minimax_service.generate_and_wait_video(
                    prompt=prompt,
                    duration=request.duration,
                    resolution=request.resolution,
                )

                if media_url:
                    logger.info(f"Video generation completed for node {request.node_id}: {media_url}")
                    return GenerateMediaResponse(
                        node_id=request.node_id,
                        media_type="video",
                        status="completed",
                        task_id=None,
                        media_url=media_url,
                        error=None,
                        elapsed_time=None,  # Calculated in service
                        updated_node=None,
                    )
                else:
                    error_msg = "Video generation failed or timed out"
                    logger.error(
                        f"Video generation failed for node {request.node_id} "
                        f"(wait_for_completion=True) - No media URL returned"
                    )
                    return GenerateMediaResponse(
                        node_id=request.node_id,
                        media_type="video",
                        status="failed",
                        task_id=None,
                        media_url=None,
                        error=error_msg,
                        elapsed_time=None,
                        updated_node=None,
                    )
            else:
                # Start async generation
                task_result = await minimax_service.generate_video(
                    prompt=prompt,
                    duration=request.duration,
                    resolution=request.resolution,
                )

                # Check if we got a successful response with task_id
                if task_result and "task_id" in task_result:
                    return GenerateMediaResponse(
                        node_id=request.node_id,
                        media_type="video",
                        status="pending",
                        task_id=task_result["task_id"],
                        media_url=None,
                        error=None,
                        elapsed_time=None,
                        updated_node=None,
                    )
                else:
                    # Extract error message with detailed diagnostics
                    error_msg = "Failed to start video generation"
                    error_type = "unknown"
                    diagnostic = {}
                    
                    if task_result:
                        if "error" in task_result:
                            error_msg = task_result["error"]
                            error_type = task_result.get("error_type", "unknown")
                            diagnostic = task_result.get("diagnostic", {})
                        else:
                            # Log the full response for debugging
                            logger.warning(f"Unexpected video generation response: {task_result}")
                            error_msg = f"Unexpected response format: missing task_id"
                            diagnostic = {"response_keys": list(task_result.keys()) if isinstance(task_result, dict) else "not_dict"}
                    else:
                        error_msg = "Video generation service returned no response"
                        error_type = "no_response"
                    
                    # Build comprehensive error message
                    detailed_error = error_msg
                    diagnostic_parts = []
                    
                    if diagnostic:
                        if "api_status_code" in diagnostic:
                            diagnostic_parts.append(f"API Status: {diagnostic['api_status_code']}")
                        if "api_status_msg" in diagnostic:
                            diagnostic_parts.append(f"Message: {diagnostic['api_status_msg']}")
                        if "api_key_configured" in diagnostic and not diagnostic.get("api_key_configured"):
                            diagnostic_parts.append("⚠️ API key not configured")
                        if "endpoint" in diagnostic:
                            diagnostic_parts.append(f"Endpoint: {diagnostic['endpoint']}")
                    
                    if task_result and "status_code" in task_result:
                        http_status = task_result["status_code"]
                        detailed_error = f"[HTTP {http_status}] {error_msg}"
                    
                    if diagnostic_parts:
                        detailed_error = f"{detailed_error} ({'; '.join(diagnostic_parts)})"
                    
                    logger.error(
                        f"Video generation failed for node {request.node_id} - "
                        f"Error: {error_msg}, Type: {error_type}, "
                        f"Full diagnostic: {diagnostic}"
                    )
                    
                    return GenerateMediaResponse(
                        node_id=request.node_id,
                        media_type="video",
                        status="failed",
                        task_id=None,
                        media_url=None,
                        error=detailed_error,
                        elapsed_time=None,
                        updated_node=None,
                    )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid media_type: {request.media_type}",
            )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(
            f"Unexpected error generating media for node {request.node_id}: "
            f"{error_type} - {error_msg}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate media: {error_type} - {error_msg}. Check server logs for details.",
        )


@router.post("/media-status", response_model=CheckMediaStatusResponse, status_code=status.HTTP_200_OK)
async def check_media_status(request: CheckMediaStatusRequest) -> CheckMediaStatusResponse:
    """
    Check the status of an ongoing media generation task.

    **Polling endpoint**: Used to check the progress of async media generation.

    **NOTE**: Image generation is SYNCHRONOUS and does not support status polling.
    This endpoint only works for videos.

    **Status values**:
    - `pending`: Task is queued
    - `generating`: Generation in progress
    - `completed`: Media is ready, URL available
    - `failed`: Generation failed, error message available

    **Usage pattern** (videos only):
    1. Call /generate-media with wait_for_completion=False
    2. Get task_id from response
    3. Poll /media-status every 10-30 seconds until status is completed or failed
    4. Update node metadata with media_url when completed
    """
    log_api_call("/api/media-status", task_id=request.task_id, media_type=request.media_type)

    # Reject image status checks since images are synchronous
    if request.media_type == "image":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image generation is synchronous and does not support status polling. Images are returned immediately from /generate-media."
        )

    try:
        # Check task status
        status_result = await minimax_service.check_task_status(
            task_id=request.task_id,
            media_type=request.media_type,
        )

        if not status_result:
            logger.error(
                f"Status check failed for task {request.task_id} - "
                f"No response from service"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {request.task_id} not found or status check failed. Check server logs for details.",
            )

        # Check if status_result contains an error
        if "error" in status_result:
            error_msg = status_result.get("error", "Unknown error")
            error_type = status_result.get("error_type", "unknown")
            diagnostic = status_result.get("diagnostic", {})
            
            logger.error(
                f"Status check error for task {request.task_id} - "
                f"Error: {error_msg}, Type: {error_type}, "
                f"Diagnostic: {diagnostic}"
            )
            
            # Build detailed error message
            detailed_error = error_msg
            if diagnostic:
                diagnostic_parts = []
                if "api_status_code" in diagnostic:
                    diagnostic_parts.append(f"API Status: {diagnostic['api_status_code']}")
                if "api_status_msg" in diagnostic:
                    diagnostic_parts.append(f"Message: {diagnostic['api_status_msg']}")
                if diagnostic_parts:
                    detailed_error = f"{error_msg} ({'; '.join(diagnostic_parts)})"
            
            return CheckMediaStatusResponse(
                task_id=request.task_id,
                node_id=request.node_id,
                media_type=request.media_type,
                status="failed",
                media_url=None,
                progress=None,
                error=detailed_error,
                updated_node=None,
            )

        task_status = status_result.get("status", "unknown")
        media_url = status_result.get("url")
        error_msg = status_result.get("error")

        # Map Minimax status to our status format
        if task_status in ["queued", "waiting"]:
            status_mapped = "pending"
        elif task_status in ["generating", "processing"]:
            status_mapped = "generating"
        elif task_status in ["completed", "success"]:
            status_mapped = "completed"
        elif task_status == "failed":
            status_mapped = "failed"
        else:
            status_mapped = "pending"
            logger.warning(f"Unknown task status '{task_status}' for task {request.task_id}")

        logger.debug(
            f"Status check for task {request.task_id}: {status_mapped} "
            f"(media_url={'present' if media_url else 'none'})"
        )

        return CheckMediaStatusResponse(
            task_id=request.task_id,
            node_id=request.node_id,
            media_type=request.media_type,
            status=status_mapped,
            media_url=media_url,
            progress=None,  # Minimax doesn't provide progress percentage
            error=error_msg,
            updated_node=None,  # Frontend will update node metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(
            f"Unexpected error checking media status for task {request.task_id}: "
            f"{error_type} - {error_msg}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check media status: {error_type} - {error_msg}. Check server logs for details.",
        )
