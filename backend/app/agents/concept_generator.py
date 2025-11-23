"""Concept Generator Agent using Gemini 1.5 Pro."""

import json
import math
import uuid
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.models.graph import MindMapState
from app.models.node import ConceptNode, NodeMetadata
from app.utils import logger


class ConceptGeneratorAgent:
    """Agent for generating concepts using Gemini 1.5 Pro."""

    def __init__(self) -> None:
        """Initialize the concept generator with Gemini API client."""
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            temperature=settings.GEMINI_TEMPERATURE,
            max_tokens=settings.GEMINI_MAX_TOKENS,
            google_api_key=settings.GEMINI_API_KEY,
        )

    async def generate_initial_concepts(
        self, topic: str, num_concepts: int = 5
    ) -> list[ConceptNode]:
        """
        Generate initial Layer 1 concepts from a topic.

        Args:
            topic: The user's initial topic/goal
            num_concepts: Number of concepts to generate (default: 5)

        Returns:
            List of ConceptNode objects for Layer 1
        """
        prompt = f"""You are an expert knowledge graph builder. Generate {num_concepts} core concepts related to: "{topic}"

For each concept, provide:
1. A short label (2-4 words)
2. A full concept description (1 sentence)
3. Why this concept is relevant to understanding "{topic}"

Format your response as a JSON array of objects with keys: "label", "concept", "relevance"

Example format:
[
  {{"label": "Core Concept 1", "concept": "Brief description of the concept", "relevance": "Why it matters"}},
  {{"label": "Core Concept 2", "concept": "Brief description of the concept", "relevance": "Why it matters"}}
]

Make concepts diverse and cover different aspects of "{topic}".
"""

        try:
            # Invoke LLM
            response = await self.llm.ainvoke(prompt)
            content = response.content

            # Parse JSON response
            concepts_data = json.loads(content)

            # Convert to ConceptNode objects
            nodes = []
            concepts_texts = []
            for i, data in enumerate(concepts_data[:num_concepts]):
                # Calculate position in radial layout (Layer 1)
                angle = (2 * math.pi * i) / num_concepts
                radius = 300  # Distance from center

                x = radius * math.cos(angle)
                y = radius * math.sin(angle)

                concept_text = data.get("concept", "")
                concepts_texts.append(concept_text)

                node = ConceptNode(
                    id=f"node_{uuid.uuid4().hex[:8]}",
                    label=data.get("label", f"Concept {i+1}"),
                    concept=concept_text,
                    isExplored=False,  # Dashed border initially
                    preferenceScore=0.0,  # Neutral initially
                    position={"x": x, "y": y},
                    parentId=None,  # Layer 1 nodes have no parent
                    children=[],
                    metadata=NodeMetadata(
                        sources=[],
                        keywords=[],
                        summary=data.get("relevance", ""),
                        uncertainty_score=0.8,  # High uncertainty (not validated yet)
                    ),
                )
                nodes.append(node)

            # Generate embeddings for all concepts in batch
            from app.services.embedding_service import embedding_service

            embeddings = await embedding_service.generate_embeddings_batch(concepts_texts)
            for node, concept_text in zip(nodes, concepts_texts):
                if node.metadata and embeddings.get(concept_text):
                    node.metadata.embedding = embeddings[concept_text]

            logger.info(f"Generated {len(nodes)} initial concepts for topic: {topic}")
            return nodes

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {str(e)}")
            # Fallback to simple concepts
            return self._generate_fallback_concepts(topic, num_concepts)
        except Exception as e:
            logger.error(f"Error generating initial concepts: {str(e)}")
            return self._generate_fallback_concepts(topic, num_concepts)

    async def generate_child_concepts(
        self,
        parent: ConceptNode,
        context: MindMapState,
        search_results: Optional[list[dict]] = None,
        num_children: int = 3,
    ) -> list[ConceptNode]:
        """
        Generate child concepts for a parent node.

        Args:
            parent: The parent concept node to expand
            context: The current graph state for additional context
            search_results: Optional search results to ground concepts
            num_children: Number of child concepts to generate (default: 3)

        Returns:
            List of child ConceptNode objects
        """
        # Build prompt with context
        search_context = ""
        if search_results:
            search_context = "\n\nRelevant search results:\n"
            for result in search_results[:3]:  # Top 3 results
                search_context += f"- {result.get('title', '')}: {result.get('snippet', '')}\n"

        prompt = f"""You are an expert knowledge graph builder.

Main topic: "{context.centerConcept}"
Parent concept: "{parent.concept}"

Generate {num_children} related sub-concepts that:
1. Are more specific than "{parent.label}"
2. Help understand the parent concept
3. Are relevant to the main topic "{context.centerConcept}"
{search_context}

Format your response as a JSON array of objects with keys: "label", "concept"

Example format:
[
  {{"label": "Sub-concept 1", "concept": "Brief description"}},
  {{"label": "Sub-concept 2", "concept": "Brief description"}}
]
"""

        try:
            # Invoke LLM
            response = await self.llm.ainvoke(prompt)
            content = response.content

            # Parse JSON response
            concepts_data = json.loads(content)

            # Calculate parent position for relative positioning
            parent_x = parent.position["x"]
            parent_y = parent.position["y"]

            # Convert to ConceptNode objects
            nodes = []
            concepts_texts = []
            for i, data in enumerate(concepts_data[:num_children]):
                # Position children in a fan pattern below parent
                angle_offset = (i - num_children / 2) * (math.pi / 6)  # 30-degree spacing
                child_radius = 150  # Distance from parent

                x = parent_x + child_radius * math.cos(angle_offset)
                y = parent_y + child_radius * math.sin(angle_offset)

                concept_text = data.get("concept", "")
                concepts_texts.append(concept_text)

                node = ConceptNode(
                    id=f"node_{uuid.uuid4().hex[:8]}",
                    label=data.get("label", f"Child {i+1}"),
                    concept=concept_text,
                    isExplored=False,  # Dashed border initially
                    preferenceScore=0.0,  # Neutral initially
                    position={"x": x, "y": y},
                    parentId=parent.id,
                    children=[],
                    metadata=NodeMetadata(
                        sources=[],
                        keywords=[],
                        summary="",
                        uncertainty_score=0.7,  # Moderate-high uncertainty
                    ),
                )
                nodes.append(node)

            # Generate embeddings for all concepts in batch
            from app.services.embedding_service import embedding_service

            embeddings = await embedding_service.generate_embeddings_batch(concepts_texts)
            for node, concept_text in zip(nodes, concepts_texts):
                if node.metadata and embeddings.get(concept_text):
                    node.metadata.embedding = embeddings[concept_text]

            logger.info(
                f"Generated {len(nodes)} child concepts for parent: {parent.label}"
            )
            return nodes

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {str(e)}")
            return self._generate_fallback_children(parent, num_children)
        except Exception as e:
            logger.error(f"Error generating child concepts: {str(e)}")
            return self._generate_fallback_children(parent, num_children)

    def _generate_fallback_concepts(self, topic: str, num: int) -> list[ConceptNode]:
        """Generate fallback concepts if LLM fails."""
        fallback_labels = [
            "Overview",
            "Key Principles",
            "Applications",
            "Related Fields",
            "Resources",
        ]

        nodes = []
        for i in range(min(num, len(fallback_labels))):
            angle = (2 * math.pi * i) / num
            radius = 300

            x = radius * math.cos(angle)
            y = radius * math.sin(angle)

            node = ConceptNode(
                id=f"node_{uuid.uuid4().hex[:8]}",
                label=fallback_labels[i],
                concept=f"{fallback_labels[i]} of {topic}",
                isExplored=False,
                preferenceScore=0.0,
                position={"x": x, "y": y},
                parentId=None,
                children=[],
                metadata=NodeMetadata(
                    sources=[],
                    keywords=[],
                    summary="",
                    uncertainty_score=1.0,
                ),
            )
            nodes.append(node)

        return nodes

    def _generate_fallback_children(
        self, parent: ConceptNode, num: int
    ) -> list[ConceptNode]:
        """Generate fallback children if LLM fails."""
        nodes = []
        parent_x = parent.position["x"]
        parent_y = parent.position["y"]

        for i in range(num):
            angle_offset = (i - num / 2) * (math.pi / 6)
            child_radius = 150

            x = parent_x + child_radius * math.cos(angle_offset)
            y = parent_y + child_radius * math.sin(angle_offset)

            node = ConceptNode(
                id=f"node_{uuid.uuid4().hex[:8]}",
                label=f"Related to {parent.label} {i+1}",
                concept=f"Aspect {i+1} of {parent.concept}",
                isExplored=False,
                preferenceScore=0.0,
                position={"x": x, "y": y},
                parentId=parent.id,
                children=[],
                metadata=NodeMetadata(
                    sources=[],
                    keywords=[],
                    summary="",
                    uncertainty_score=1.0,
                ),
            )
            nodes.append(node)

        return nodes
