"""Storage Service for MongoDB persistence (stretch goal)."""

from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.config import settings
from app.models.graph import GraphSnapshot, MindMapState
from app.utils import logger


class StorageService:
    """Service for persisting graphs and trajectories to MongoDB."""

    def __init__(self) -> None:
        """Initialize the storage service with MongoDB client."""
        self.client: Optional[AsyncIOMotorClient] = None  # type: ignore
        self.db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self) -> None:
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.client.surreal
            # Test connection
            await self.client.admin.command("ping")
            logger.info("Connected to MongoDB successfully")
        except PyMongoError as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            self.client = None
            self.db = None

    async def disconnect(self) -> None:
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def save_graph(self, session_id: str, graph: MindMapState) -> bool:
        """
        Save a graph to MongoDB.

        Args:
            session_id: Unique session identifier
            graph: The graph state to save

        Returns:
            True if saved successfully, False otherwise
        """
        if not self.db:
            logger.warning("MongoDB not connected, skipping save")
            return False

        try:
            collection = self.db.graphs

            # Convert graph to dict
            graph_dict = graph.model_dump()
            graph_dict["session_id"] = session_id
            graph_dict["updated_at"] = datetime.now()

            # Upsert (update if exists, insert if not)
            result = await collection.update_one(
                {"session_id": session_id},
                {"$set": graph_dict},
                upsert=True,
            )

            logger.info(f"Saved graph for session {session_id}")
            return True

        except PyMongoError as e:
            logger.error(f"Error saving graph: {str(e)}")
            return False

    async def load_graph(self, session_id: str) -> Optional[MindMapState]:
        """
        Load a graph from MongoDB.

        Args:
            session_id: Session identifier

        Returns:
            MindMapState if found, None otherwise
        """
        if not self.db:
            logger.warning("MongoDB not connected, cannot load")
            return None

        try:
            collection = self.db.graphs
            graph_dict = await collection.find_one({"session_id": session_id})

            if graph_dict:
                # Remove MongoDB ID and session_id before parsing
                graph_dict.pop("_id", None)
                graph_dict.pop("session_id", None)
                graph_dict.pop("updated_at", None)

                graph = MindMapState(**graph_dict)
                logger.info(f"Loaded graph for session {session_id}")
                return graph
            else:
                logger.info(f"No graph found for session {session_id}")
                return None

        except PyMongoError as e:
            logger.error(f"Error loading graph: {str(e)}")
            return None

    async def save_trajectory(
        self, session_id: str, state: MindMapState, action: dict, reward: float
    ) -> bool:
        """
        Save an interaction trajectory for RL training.

        Args:
            session_id: Session identifier
            state: Graph state before action
            action: Action taken
            reward: Reward signal

        Returns:
            True if saved successfully, False otherwise
        """
        if not self.db:
            logger.warning("MongoDB not connected, skipping trajectory save")
            return False

        try:
            collection = self.db.trajectories

            snapshot = GraphSnapshot(
                sessionId=session_id,
                timestamp=datetime.now(),
                state=state,
                action=action,
                reward=reward,
            )

            await collection.insert_one(snapshot.model_dump())
            logger.debug(f"Saved trajectory for session {session_id}")
            return True

        except PyMongoError as e:
            logger.error(f"Error saving trajectory: {str(e)}")
            return False

    async def get_trajectories(self, session_id: str) -> list[GraphSnapshot]:
        """
        Get all trajectories for a session.

        Args:
            session_id: Session identifier

        Returns:
            List of GraphSnapshot objects
        """
        if not self.db:
            logger.warning("MongoDB not connected, cannot load trajectories")
            return []

        try:
            collection = self.db.trajectories
            cursor = collection.find({"sessionId": session_id}).sort("timestamp", 1)

            trajectories = []
            async for doc in cursor:
                doc.pop("_id", None)  # Remove MongoDB ID
                snapshot = GraphSnapshot(**doc)
                trajectories.append(snapshot)

            logger.info(
                f"Loaded {len(trajectories)} trajectories for session {session_id}"
            )
            return trajectories

        except PyMongoError as e:
            logger.error(f"Error loading trajectories: {str(e)}")
            return []

    async def list_sessions(self) -> list[dict]:
        """
        List all sessions in the database.

        Returns:
            List of session info dictionaries
        """
        if not self.db:
            logger.warning("MongoDB not connected, cannot list sessions")
            return []

        try:
            collection = self.db.graphs
            cursor = collection.find(
                {}, {"session_id": 1, "centerConcept": 1, "updated_at": 1}
            ).sort("updated_at", -1)

            sessions = []
            async for doc in cursor:
                sessions.append(
                    {
                        "session_id": doc.get("session_id"),
                        "topic": doc.get("centerConcept"),
                        "updated_at": doc.get("updated_at"),
                    }
                )

            return sessions

        except PyMongoError as e:
            logger.error(f"Error listing sessions: {str(e)}")
            return []
