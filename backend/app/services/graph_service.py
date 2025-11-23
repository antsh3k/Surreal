"""Graph Service for business logic of graph operations."""

import uuid
from typing import Any

from app.agents import ConceptGeneratorAgent, ExpansionAgent
from app.core import (
    get_preference_hint,
    propagate_preference,
    update_preference_score,
)
from app.models.graph import MindMapState
from app.models.node import ConceptNode
from app.utils import logger


class GraphService:
    """Service for managing knowledge graph operations."""

    def __init__(self) -> None:
        """Initialize the graph service with agents."""
        self.concept_generator = ConceptGeneratorAgent()
        self.expansion_agent = ExpansionAgent()

    async def create_initial_graph(self, topic: str) -> MindMapState:
        """
        Create initial graph from a topic.

        Generates:
        - Center node (the "Self Node")
        - Layer 1 nodes (4-5 initial concepts)

        Args:
            topic: User's initial topic/goal

        Returns:
            MindMapState with initial graph structure
        """
        logger.info(f"Creating initial graph for topic: {topic}")

        try:
            # Generate Layer 1 concepts
            layer1_nodes = await self.concept_generator.generate_initial_concepts(
                topic, num_concepts=5
            )

            # Create center node
            center_node = ConceptNode(
                id="center",
                label=topic[:30],  # Truncate if too long
                concept=topic,
                isExplored=True,  # Center is always explored (solid border)
                preferenceScore=0.0,
                position={"x": 0.0, "y": 0.0},
                parentId=None,
                children=[node.id for node in layer1_nodes],
                metadata=None,
            )

            # Update Layer 1 nodes to have center as parent
            for node in layer1_nodes:
                node.parentId = center_node.id

            # Create initial graph state
            graph = MindMapState(
                centerConcept=topic,
                nodes=[center_node] + layer1_nodes,
                isGenerating=False,
                loadingNodeId=None,
                selectedNodeId=None,
                infoPanel=None,
            )

            logger.info(
                f"Created initial graph with {len(layer1_nodes)} Layer 1 nodes"
            )
            return graph

        except Exception as e:
            logger.error(f"Error creating initial graph: {str(e)}")
            # Return minimal fallback graph
            center_node = ConceptNode(
                id="center",
                label=topic[:30],
                concept=topic,
                isExplored=True,
                preferenceScore=0.0,
                position={"x": 0.0, "y": 0.0},
                parentId=None,
                children=[],
                metadata=None,
            )
            return MindMapState(
                centerConcept=topic,
                nodes=[center_node],
                isGenerating=False,
                loadingNodeId=None,
                selectedNodeId=None,
                infoPanel=None,
            )

    async def expand_node(
        self, node_id: str, graph: MindMapState
    ) -> dict[str, Any]:
        """
        Expand a node and generate children.

        Args:
            node_id: ID of the node to expand
            graph: Current graph state

        Returns:
            Dictionary with:
            - children: List of generated child nodes
            - reward: Reward signal
            - parent_updated: Updated parent node
            - error: Error message if any
        """
        logger.info(f"Expanding node: {node_id}")

        # Find the node to expand
        node_to_expand = None
        for node in graph.nodes:
            if node.id == node_id:
                node_to_expand = node
                break

        if node_to_expand is None:
            logger.error(f"Node not found: {node_id}")
            return {
                "children": [],
                "reward": 0.0,
                "parent_updated": None,
                "error": f"Node not found: {node_id}",
            }

        try:
            # Use expansion agent to generate children
            result = await self.expansion_agent.expand(node_to_expand, graph)

            # Add children to graph
            if result["children"]:
                graph.nodes.extend(result["children"])

                # Update parent node in graph
                for i, node in enumerate(graph.nodes):
                    if node.id == node_id:
                        graph.nodes[i] = result["parent_updated"]
                        break

            logger.info(
                f"Expanded node {node_id}: "
                f"{len(result['children'])} children, "
                f"reward: {result['reward']:.3f}"
            )

            return result

        except Exception as e:
            logger.error(f"Error expanding node {node_id}: {str(e)}")
            return {
                "children": [],
                "reward": 0.0,
                "parent_updated": node_to_expand,
                "error": str(e),
            }

    def update_preferences(
        self, node_id: str, action: str, graph: MindMapState
    ) -> dict[str, Any]:
        """
        Update preference scores based on user interaction.

        Args:
            node_id: ID of the node that was interacted with
            action: Type of interaction (hover, click, expand, info)
            graph: Current graph state

        Returns:
            Dictionary with:
            - updated_node: Node with new preference score
            - affected_siblings: Siblings with propagated scores
            - preference_hint: Visual hint (preferred/uncertain/neutral)
        """
        logger.info(f"Updating preference for node {node_id} with action: {action}")

        # Find the node
        target_node = None
        for node in graph.nodes:
            if node.id == node_id:
                target_node = node
                break

        if target_node is None:
            logger.error(f"Node not found: {node_id}")
            return {
                "updated_node": None,
                "affected_siblings": [],
                "preference_hint": "neutral",
                "error": f"Node not found: {node_id}",
            }

        try:
            # Update preference score
            old_score = target_node.preferenceScore
            new_score = update_preference_score(target_node, action)  # type: ignore
            target_node.preferenceScore = new_score

            # Propagate to siblings
            affected_siblings = propagate_preference(graph, node_id)

            # Get visual hint
            hint = get_preference_hint(new_score)

            logger.info(
                f"Updated preference for {node_id}: "
                f"{old_score:.2f} -> {new_score:.2f} ({hint})"
            )

            return {
                "updated_node": target_node,
                "affected_siblings": affected_siblings,
                "preference_hint": hint,
                "error": None,
            }

        except Exception as e:
            logger.error(f"Error updating preferences: {str(e)}")
            return {
                "updated_node": target_node,
                "affected_siblings": [],
                "preference_hint": "neutral",
                "error": str(e),
            }

    def get_node_by_id(self, node_id: str, graph: MindMapState) -> ConceptNode | None:
        """Get a node by its ID."""
        for node in graph.nodes:
            if node.id == node_id:
                return node
        return None

    def get_children(self, node_id: str, graph: MindMapState) -> list[ConceptNode]:
        """Get all children of a node."""
        children = []
        for node in graph.nodes:
            if node.parentId == node_id:
                children.append(node)
        return children

    def get_siblings(self, node_id: str, graph: MindMapState) -> list[ConceptNode]:
        """Get all siblings of a node (nodes with same parent)."""
        target_node = self.get_node_by_id(node_id, graph)
        if not target_node or not target_node.parentId:
            return []

        siblings = []
        for node in graph.nodes:
            if node.id != node_id and node.parentId == target_node.parentId:
                siblings.append(node)
        return siblings

    def export_graph(self, graph: MindMapState) -> dict:
        """Export graph to JSON-serializable format."""
        return graph.model_dump()

    def get_graph_stats(self, graph: MindMapState) -> dict:
        """Get statistics about the graph."""
        total_nodes = len(graph.nodes)
        explored_nodes = sum(1 for node in graph.nodes if node.isExplored)
        preferred_nodes = sum(1 for node in graph.nodes if node.preferenceScore > 0.3)
        uncertain_nodes = sum(
            1 for node in graph.nodes if node.preferenceScore < -0.2
        )

        return {
            "total_nodes": total_nodes,
            "explored_nodes": explored_nodes,
            "unexplored_nodes": total_nodes - explored_nodes,
            "preferred_nodes": preferred_nodes,
            "uncertain_nodes": uncertain_nodes,
            "center_concept": graph.centerConcept,
        }

    def get_graph_analytics(self, graph: MindMapState, session_id: str | None = None) -> dict:
        """
        Get comprehensive analytics for the graph.

        Includes layer-based metrics, preference distributions, and exploration statistics.

        Args:
            graph: Current graph state
            session_id: Optional session ID for trajectory data

        Returns:
            Dictionary with comprehensive analytics
        """
        from app.core.free_energy import calculate_entropy
        from app.config import settings

        # Basic counts
        total_nodes = len(graph.nodes)
        explored_nodes = sum(1 for node in graph.nodes if node.isExplored)
        unexplored_nodes = total_nodes - explored_nodes

        # Preference categorization
        preferred_nodes = sum(
            1 for node in graph.nodes
            if node.preferenceScore > settings.PREFERENCE_THRESHOLD_PREFERRED
        )
        uncertain_nodes = sum(
            1 for node in graph.nodes
            if node.preferenceScore < settings.PREFERENCE_THRESHOLD_UNCERTAIN
        )
        neutral_nodes = total_nodes - preferred_nodes - uncertain_nodes

        # Calculate layer for each node (based on distance from center)
        layer_map: dict[str, int] = {}
        layer_uncertainty: dict[int, list[float]] = {}
        layer_counts: dict[int, int] = {}

        def assign_layer(node_id: str, current_layer: int = 0) -> None:
            """Recursively assign layers to nodes."""
            if node_id in layer_map:
                return
            layer_map[node_id] = current_layer

            # Find children
            for node in graph.nodes:
                if node.parentId == node_id:
                    assign_layer(node.id, current_layer + 1)

        # Start from center node
        assign_layer("center", 0)

        # Calculate uncertainty by layer
        for node in graph.nodes:
            layer = layer_map.get(node.id, 0)

            if layer not in layer_uncertainty:
                layer_uncertainty[layer] = []
                layer_counts[layer] = 0

            # Calculate uncertainty for this node
            uncertainty = calculate_entropy(node)
            layer_uncertainty[layer].append(uncertainty)
            layer_counts[layer] += 1

        # Average uncertainty by layer
        avg_uncertainty_by_layer = {}
        for layer, uncertainties in layer_uncertainty.items():
            avg = sum(uncertainties) / len(uncertainties) if uncertainties else 0.0
            avg_uncertainty_by_layer[f"Layer {layer}"] = avg

        # Nodes by layer
        nodes_by_layer = {f"Layer {layer}": count for layer, count in layer_counts.items()}

        # Preference distribution
        preference_distribution = {
            "preferred": preferred_nodes,
            "uncertain": uncertain_nodes,
            "neutral": neutral_nodes,
        }

        # Exploration rate
        exploration_rate = explored_nodes / total_nodes if total_nodes > 0 else 0.0

        return {
            "total_nodes": total_nodes,
            "explored_nodes": explored_nodes,
            "unexplored_nodes": unexplored_nodes,
            "preferred_nodes": preferred_nodes,
            "uncertain_nodes": uncertain_nodes,
            "neutral_nodes": neutral_nodes,
            "avg_uncertainty_by_layer": avg_uncertainty_by_layer,
            "nodes_by_layer": nodes_by_layer,
            "preference_distribution": preference_distribution,
            "exploration_rate": exploration_rate,
            "center_concept": graph.centerConcept,
            "session_id": session_id,
        }

    async def auto_expand_graph(
        self,
        graph: MindMapState,
        max_nodes: int = 10,
        strategy: str = "uncertainty",
        time_limit: int = 60,
        uncertainty_threshold: float = 0.3,
    ) -> dict[str, Any]:
        """
        Autonomously expand the graph using the specified strategy.

        This demonstrates the system working as a true RL agent without human input.

        Args:
            graph: Current graph state
            max_nodes: Maximum number of nodes to expand (default: 10)
            strategy: Expansion strategy ("uncertainty", "preference", "expected_gain")
            time_limit: Time limit in seconds (default: 60)
            uncertainty_threshold: Minimum uncertainty for "uncertainty" strategy

        Returns:
            Dictionary with:
            - expanded_nodes: List of all new nodes created
            - expansion_count: Number of expansions performed
            - total_reward: Sum of all rewards
            - avg_reward_per_expansion: Average reward
            - final_graph_stats: Graph statistics after expansion
            - stopped_reason: Why the expansion stopped
        """
        import asyncio
        import time

        from app.core.free_energy import (
            calculate_entropy,
            calculate_expected_information_gain,
        )

        logger.info(
            f"Starting auto-expansion: strategy={strategy}, max_nodes={max_nodes}, time_limit={time_limit}s"
        )

        start_time = time.time()
        expanded_nodes: list[ConceptNode] = []
        expansion_count = 0
        total_reward = 0.0
        stopped_reason = "completed"

        try:
            while expansion_count < max_nodes:
                # Check time limit
                elapsed_time = time.time() - start_time
                if elapsed_time >= time_limit:
                    stopped_reason = "time_limit"
                    logger.info(f"Auto-expansion stopped: time limit reached ({elapsed_time:.1f}s)")
                    break

                # Find unexplored nodes
                unexplored_nodes = [
                    node for node in graph.nodes if not node.isExplored and node.id != "center"
                ]

                if not unexplored_nodes:
                    stopped_reason = "no_unexplored_nodes"
                    logger.info("Auto-expansion stopped: no unexplored nodes remaining")
                    break

                # Select next node based on strategy
                selected_node = None

                if strategy == "uncertainty":
                    # Expand nodes with highest uncertainty
                    scored_nodes = []
                    for node in unexplored_nodes:
                        uncertainty = calculate_entropy(node)
                        if uncertainty >= uncertainty_threshold:
                            scored_nodes.append((node, uncertainty))

                    if not scored_nodes:
                        stopped_reason = "threshold"
                        logger.info(
                            f"Auto-expansion stopped: no nodes above uncertainty threshold ({uncertainty_threshold})"
                        )
                        break

                    # Sort by uncertainty (highest first)
                    scored_nodes.sort(key=lambda x: x[1], reverse=True)
                    selected_node = scored_nodes[0][0]

                elif strategy == "preference":
                    # Expand nodes with highest preference scores
                    selected_node = max(unexplored_nodes, key=lambda n: n.preferenceScore)

                elif strategy == "expected_gain":
                    # Expand nodes with highest expected information gain
                    scored_nodes = []
                    for node in unexplored_nodes:
                        expected_gain = await calculate_expected_information_gain(
                            node, graph
                        )
                        scored_nodes.append((node, expected_gain))

                    # Sort by expected gain (highest first)
                    scored_nodes.sort(key=lambda x: x[1], reverse=True)
                    selected_node = scored_nodes[0][0]

                else:
                    logger.error(f"Unknown expansion strategy: {strategy}")
                    stopped_reason = "error"
                    break

                if selected_node is None:
                    stopped_reason = "error"
                    logger.error("Failed to select a node for expansion")
                    break

                # Expand the selected node
                logger.info(
                    f"Auto-expanding node {expansion_count + 1}/{max_nodes}: "
                    f"{selected_node.concept[:50]}..."
                )

                try:
                    result = await self.expand_node(selected_node.id, graph)

                    if result.get("error"):
                        logger.warning(f"Failed to expand node: {result['error']}")
                        # Mark as explored to avoid trying again
                        selected_node.isExplored = True
                        continue

                    # Track results
                    expansion_count += 1
                    total_reward += result["reward"]
                    expanded_nodes.extend(result["children"])

                    logger.info(
                        f"Expansion {expansion_count} completed: "
                        f"{len(result['children'])} children, reward={result['reward']:.3f}"
                    )

                except Exception as e:
                    logger.warning(f"Error during node expansion: {str(e)}")
                    # Continue with next node instead of failing completely
                    selected_node.isExplored = True
                    continue

                # Brief pause to avoid API rate limits
                await asyncio.sleep(0.5)

            # Calculate final statistics
            avg_reward_per_expansion = (
                total_reward / expansion_count if expansion_count > 0 else 0.0
            )
            final_stats = self.get_graph_stats(graph)

            elapsed_total = time.time() - start_time
            logger.info(
                f"Auto-expansion completed: "
                f"{expansion_count} expansions, "
                f"{len(expanded_nodes)} new nodes, "
                f"total_reward={total_reward:.3f}, "
                f"time={elapsed_total:.1f}s, "
                f"reason={stopped_reason}"
            )

            return {
                "expanded_nodes": expanded_nodes,
                "expansion_count": expansion_count,
                "total_reward": total_reward,
                "avg_reward_per_expansion": avg_reward_per_expansion,
                "final_graph_stats": final_stats,
                "stopped_reason": stopped_reason,
                "elapsed_time": elapsed_total,
            }

        except Exception as e:
            logger.error(f"Error during auto-expansion: {str(e)}")
            return {
                "expanded_nodes": expanded_nodes,
                "expansion_count": expansion_count,
                "total_reward": total_reward,
                "avg_reward_per_expansion": (
                    total_reward / expansion_count if expansion_count > 0 else 0.0
                ),
                "final_graph_stats": self.get_graph_stats(graph),
                "stopped_reason": "error",
                "error": str(e),
                "elapsed_time": time.time() - start_time,
            }
