"""Minimax Service for generating images and videos using Minimax API."""

import asyncio
from typing import Literal, Optional

import httpx

from app.config import settings
from app.utils import logger


class MinimaxService:
    """Service for generating multimedia content (images and videos) using Minimax API."""

    def __init__(self) -> None:
        """Initialize the Minimax service with API configuration."""
        self.api_key = settings.MINIMAX_API_KEY
        self.base_url = settings.MINIMAX_API_BASE_URL
        self.image_model = settings.MINIMAX_IMAGE_MODEL
        self.video_model = settings.MINIMAX_VIDEO_MODEL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        num_images: int = 1,
    ) -> Optional[dict]:
        """
        Generate an image using Minimax text-to-image API.

        Args:
            prompt: Text description of the image (max 1500 chars)
            aspect_ratio: Image aspect ratio (e.g., "1:1", "16:9", "9:16")
            num_images: Number of images to generate (default: 1)

        Returns:
            Dictionary with task_id for polling, or None if creation fails
            Format: {"task_id": "...", "status": "..."}
        """
        # Truncate prompt if too long
        if len(prompt) > settings.MINIMAX_MAX_PROMPT_LENGTH_IMAGE:
            logger.warning(
                f"Prompt too long ({len(prompt)} chars), truncating to {settings.MINIMAX_MAX_PROMPT_LENGTH_IMAGE}"
            )
            prompt = prompt[: settings.MINIMAX_MAX_PROMPT_LENGTH_IMAGE]

        endpoint = f"{self.base_url}/image_generation"
        payload = {
            "model": self.image_model,
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "n": num_images,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Generating image with prompt: {prompt[:100]}...")
                response = await client.post(endpoint, json=payload, headers=self.headers)
                response.raise_for_status()

                result = response.json()
                logger.info(f"Image generation task created: {result.get('task_id')}")
                return result

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during image generation: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            return None

    async def generate_video(
        self,
        prompt: str,
        duration: int = 6,
        resolution: Literal["768P", "1080P"] = "768P",
        first_frame_image: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Generate a video using Minimax text-to-video API.

        Args:
            prompt: Text description of the video (max 2000 chars)
            duration: Video duration in seconds (6 or 10)
            resolution: Video resolution ("768P" or "1080P")
            first_frame_image: Optional URL of first frame image for image-to-video

        Returns:
            Dictionary with task_id for polling, or None if creation fails
            Format: {"task_id": "...", "status": "..."}
        """
        # Truncate prompt if too long
        if len(prompt) > settings.MINIMAX_MAX_PROMPT_LENGTH_VIDEO:
            logger.warning(
                f"Prompt too long ({len(prompt)} chars), truncating to {settings.MINIMAX_MAX_PROMPT_LENGTH_VIDEO}"
            )
            prompt = prompt[: settings.MINIMAX_MAX_PROMPT_LENGTH_VIDEO]

        endpoint = f"{self.base_url}/video_generation"
        payload = {
            "model": self.video_model,
            "prompt": prompt,
            "duration": duration,
            "resolution": resolution,
        }

        # Add first frame if provided
        if first_frame_image:
            payload["first_frame_image"] = first_frame_image

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                logger.info(f"Generating video with prompt: {prompt[:100]}...")
                response = await client.post(endpoint, json=payload, headers=self.headers)
                response.raise_for_status()

                result = response.json()
                logger.info(f"Video generation task created: {result.get('task_id')}")
                return result

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during video generation: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error generating video: {str(e)}")
            return None

    async def check_task_status(
        self,
        task_id: str,
        media_type: Literal["image", "video"],
    ) -> Optional[dict]:
        """
        Check the status of a generation task.

        Args:
            task_id: The task ID returned from generate_image or generate_video
            media_type: Type of media being generated ("image" or "video")

        Returns:
            Dictionary with status and URL if complete, or None if query fails
            Format: {
                "status": "queued|generating|completed|failed",
                "url": "..." (if completed),
                "error": "..." (if failed)
            }
        """
        endpoint_map = {
            "image": f"{self.base_url}/query/image_generation",
            "video": f"{self.base_url}/query/video_generation",
        }
        endpoint = endpoint_map.get(media_type)

        if not endpoint:
            logger.error(f"Invalid media_type: {media_type}")
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    endpoint,
                    params={"task_id": task_id},
                    headers=self.headers,
                )
                response.raise_for_status()

                result = response.json()
                status = result.get("status", "unknown")
                logger.debug(f"Task {task_id} status: {status}")

                return result

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error checking task status: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error checking task status: {str(e)}")
            return None

    async def poll_until_complete(
        self,
        task_id: str,
        media_type: Literal["image", "video"],
        max_attempts: Optional[int] = None,
        poll_interval: Optional[int] = None,
    ) -> Optional[dict]:
        """
        Poll task status until completion or timeout.

        Args:
            task_id: The task ID to poll
            media_type: Type of media being generated ("image" or "video")
            max_attempts: Maximum number of polling attempts (default from config)
            poll_interval: Seconds between polls (default from config)

        Returns:
            Final result with URL if successful, or None if failed/timeout
            Format: {
                "status": "completed|failed|timeout",
                "url": "..." (if completed),
                "error": "..." (if failed),
                "duration": seconds_elapsed
            }
        """
        max_attempts = max_attempts or settings.MINIMAX_MAX_POLL_ATTEMPTS
        poll_interval = poll_interval or settings.MINIMAX_POLL_INTERVAL

        logger.info(f"Polling task {task_id} (max {max_attempts} attempts, {poll_interval}s interval)")

        for attempt in range(1, max_attempts + 1):
            result = await self.check_task_status(task_id, media_type)

            if not result:
                logger.warning(f"Failed to check status on attempt {attempt}/{max_attempts}")
                await asyncio.sleep(poll_interval)
                continue

            status = result.get("status", "unknown")

            if status == "completed":
                logger.info(f"Task {task_id} completed successfully on attempt {attempt}")
                result["duration"] = attempt * poll_interval
                return result

            elif status == "failed":
                logger.error(f"Task {task_id} failed: {result.get('error', 'Unknown error')}")
                result["duration"] = attempt * poll_interval
                return result

            elif status in ["queued", "generating", "processing"]:
                logger.debug(f"Task {task_id} still {status}, attempt {attempt}/{max_attempts}")
                await asyncio.sleep(poll_interval)

            else:
                logger.warning(f"Unknown status '{status}' for task {task_id}")
                await asyncio.sleep(poll_interval)

        # Timeout
        logger.error(f"Task {task_id} timed out after {max_attempts} attempts")
        return {
            "status": "timeout",
            "error": f"Task did not complete within {max_attempts * poll_interval} seconds",
            "duration": max_attempts * poll_interval,
        }

    async def generate_and_wait_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
    ) -> Optional[str]:
        """
        Generate an image and wait for completion.

        Convenience method that combines generation and polling.

        Args:
            prompt: Text description of the image
            aspect_ratio: Image aspect ratio

        Returns:
            URL of generated image, or None if failed
        """
        # Create task
        task_result = await self.generate_image(prompt, aspect_ratio)
        if not task_result or "task_id" not in task_result:
            return None

        # Poll until complete
        final_result = await self.poll_until_complete(task_result["task_id"], "image")

        if final_result and final_result.get("status") == "completed":
            return final_result.get("url")

        return None

    async def generate_and_wait_video(
        self,
        prompt: str,
        duration: int = 6,
        resolution: Literal["768P", "1080P"] = "768P",
    ) -> Optional[str]:
        """
        Generate a video and wait for completion.

        Convenience method that combines generation and polling.

        Args:
            prompt: Text description of the video
            duration: Video duration in seconds
            resolution: Video resolution

        Returns:
            URL of generated video, or None if failed
        """
        # Create task
        task_result = await self.generate_video(prompt, duration, resolution)
        if not task_result or "task_id" not in task_result:
            return None

        # Poll until complete
        final_result = await self.poll_until_complete(task_result["task_id"], "video")

        if final_result and final_result.get("status") == "completed":
            return final_result.get("url")

        return None


# Global instance
minimax_service = MinimaxService()
