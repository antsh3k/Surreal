"""Expansion Agent using LangGraph for orchestrated node expansion."""

from typing import Any, Optional, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.concept_generator import ConceptGeneratorAgent
from app.agents.search_agent import SearchAgent
from app.config import settings
from app.core import calculate_free_energy, calculate_reward, update_node_explored_status
from app.models.graph import MindMapState
from app.models.node import ConceptNode
from app.utils import logger


class ExpansionState(TypedDict):
    """State structure for the expansion graph workflow."""

    node: ConceptNode
    context: MindMapState
    search_results: Optional[list[dict]]
    children: list[ConceptNode]
    uncertainty_before: float
    uncertainty_after: float
    reward: float
    error: Optional[str]


class ExpansionAgent:
    """Agent for orchestrating node expansion using LangGraph."""

    def __init__(self) -> None:
        """Initialize the expansion agent with sub-agents and workflow graph."""
        self.concept_generator = ConceptGeneratorAgent()
        self.search_agent = SearchAgent()

        # Build the LangGraph workflow
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph state machine for expansion."""
        workflow = StateGraph(ExpansionState)

        # Add nodes (workflow steps)
        workflow.add_node("calculate_initial_uncertainty", self._calculate_initial_uncertainty)
        workflow.add_node("perform_search", self._perform_search)
        workflow.add_node("generate_concepts", self._generate_concepts)
        workflow.add_node("validate_children", self._validate_children)
        workflow.add_node("calculate_reward", self._calculate_reward_step)

        # Define edges (workflow sequence)
        workflow.set_entry_point("calculate_initial_uncertainty")
        workflow.add_edge("calculate_initial_uncertainty", "perform_search")
        workflow.add_edge("perform_search", "generate_concepts")
        workflow.add_edge("generate_concepts", "validate_children")
        workflow.add_edge("validate_children", "calculate_reward")
        workflow.add_edge("calculate_reward", END)

        return workflow.compile()

    async def _calculate_initial_uncertainty(self, state: ExpansionState) -> ExpansionState:
        """Step 1: Calculate free energy before expansion."""
        try:
            free_energy = await calculate_free_energy(state["node"], state["context"])
            state["uncertainty_before"] = free_energy
            logger.debug(
                f"Initial uncertainty for {state['node'].label}: {free_energy:.3f}"
            )
        except Exception as e:
            logger.error(f"Error calculating initial uncertainty: {str(e)}")
            state["error"] = str(e)
            state["uncertainty_before"] = 1.0

        return state

    async def _perform_search(self, state: ExpansionState) -> ExpansionState:
        """Step 2: Perform search if uncertainty is high."""
        try:
            # Only search if uncertainty is above threshold
            if state["uncertainty_before"] >= settings.UNCERTAINTY_THRESHOLD:
                query = f"{state['node'].concept} {state['context'].centerConcept}"
                results = await self.search_agent.search_concept(query)
                state["search_results"] = results
                logger.info(
                    f"Search found {len(results)} results for: {state['node'].label}"
                )
            else:
                state["search_results"] = []
                logger.debug(
                    f"Skipping search for {state['node'].label} (low uncertainty)"
                )
        except Exception as e:
            logger.error(f"Error during search: {str(e)}")
            state["search_results"] = []
            state["error"] = str(e)

        return state

    async def _generate_concepts(self, state: ExpansionState) -> ExpansionState:
        """Step 3: Generate child concepts using Gemini."""
        try:
            children = await self.concept_generator.generate_child_concepts(
                parent=state["node"],
                context=state["context"],
                search_results=state.get("search_results"),
                num_children=3,  # Generate 2-4 children
            )
            state["children"] = children
            logger.info(
                f"Generated {len(children)} children for: {state['node'].label}"
            )
        except Exception as e:
            logger.error(f"Error generating concepts: {str(e)}")
            state["children"] = []
            state["error"] = str(e)

        return state

    async def _validate_children(self, state: ExpansionState) -> ExpansionState:
        """Step 4: Validate children and calculate uncertainty for each."""
        try:
            # Enrich children with search metadata
            for child in state["children"]:
                # Search and add metadata
                metadata = await self.search_agent.validate_concept(
                    child.concept, state["context"].centerConcept
                )
                child.metadata = metadata

                # Update explored status based on uncertainty
                child = update_node_explored_status(child)

            # Calculate average uncertainty after expansion
            if state["children"]:
                avg_uncertainty = sum(
                    child.metadata.uncertainty_score if child.metadata else 1.0
                    for child in state["children"]
                ) / len(state["children"])
                state["uncertainty_after"] = avg_uncertainty
            else:
                state["uncertainty_after"] = state["uncertainty_before"]

            logger.debug(
                f"Validated {len(state['children'])} children. "
                f"Avg uncertainty: {state['uncertainty_after']:.3f}"
            )

        except Exception as e:
            logger.error(f"Error validating children: {str(e)}")
            state["uncertainty_after"] = state["uncertainty_before"]
            state["error"] = str(e)

        return state

    async def _calculate_reward_step(self, state: ExpansionState) -> ExpansionState:
        """Step 5: Calculate reward signal (surprise reduction)."""
        try:
            reward = calculate_reward(
                free_energy_before=state["uncertainty_before"],
                free_energy_after=state["uncertainty_after"],
                action_type="expand",
            )
            state["reward"] = reward
            logger.info(
                f"Reward for expanding {state['node'].label}: {reward:.3f}"
            )
        except Exception as e:
            logger.error(f"Error calculating reward: {str(e)}")
            state["reward"] = 0.0
            state["error"] = str(e)

        return state

    async def expand(
        self, node: ConceptNode, context: MindMapState
    ) -> dict[str, Any]:
        """
        Expand a node and generate child concepts.

        This is the main entry point for the expansion workflow.

        Args:
            node: The node to expand
            context: The current graph state

        Returns:
            Dictionary with:
            - children: List of generated ConceptNode objects
            - reward: Reward signal (surprise reduction)
            - parent_updated: Updated parent node with new status
        """
        # Initialize state
        initial_state: ExpansionState = {
            "node": node,
            "context": context,
            "search_results": None,
            "children": [],
            "uncertainty_before": 0.0,
            "uncertainty_after": 0.0,
            "reward": 0.0,
            "error": None,
        }

        try:
            # Run the workflow
            final_state = await self.workflow.ainvoke(initial_state)

            # Update parent node
            parent_updated = node
            parent_updated.isExplored = True  # Mark as explored after expansion
            parent_updated.children = [child.id for child in final_state["children"]]

            return {
                "children": final_state["children"],
                "reward": final_state["reward"],
                "parent_updated": parent_updated,
                "error": final_state.get("error"),
            }

        except Exception as e:
            logger.error(f"Error in expansion workflow: {str(e)}")
            return {
                "children": [],
                "reward": 0.0,
                "parent_updated": node,
                "error": str(e),
            }
