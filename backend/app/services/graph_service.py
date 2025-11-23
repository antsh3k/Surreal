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
