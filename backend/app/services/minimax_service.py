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
        
        # Validate configuration on initialization
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate Minimax API configuration."""
        issues = []
        
        if not self.api_key or self.api_key.strip() == "":
            issues.append("MINIMAX_API_KEY is not set or empty")
        elif len(self.api_key) < 10:
            issues.append(f"MINIMAX_API_KEY appears invalid (too short: {len(self.api_key)} chars)")
        
        if not self.base_url or not self.base_url.startswith("http"):
            issues.append(f"MINIMAX_API_BASE_URL appears invalid: {self.base_url}")
        
        if not self.image_model:
            issues.append("MINIMAX_IMAGE_MODEL is not set")
        
        if not self.video_model:
            issues.append("MINIMAX_VIDEO_MODEL is not set")
        
        if issues:
            logger.warning(f"Minimax configuration issues detected: {'; '.join(issues)}")
        else:
            logger.debug(f"Minimax service initialized: base_url={self.base_url}, image_model={self.image_model}, video_model={self.video_model}")
    
    def _mask_api_key(self, api_key: str) -> str:
        """Mask API key for logging (show first 4 and last 4 chars)."""
        if not api_key or len(api_key) < 8:
            return "***"
        return f"{api_key[:4]}...{api_key[-4:]}"

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        num_images: int = 1,
        response_format: Literal["base64", "url"] = "url",
    ) -> Optional[dict]:
        """
        Generate an image using Minimax text-to-image API.

        NOTE: Image generation is SYNCHRONOUS (unlike videos).
        Returns images directly, not a task_id for polling.

        Args:
            prompt: Text description of the image (max 1500 chars)
            aspect_ratio: Image aspect ratio (e.g., "1:1", "16:9", "9:16")
            num_images: Number of images to generate (default: 1)
            response_format: "url" for URLs or "base64" for base64 strings

        Returns:
            Dictionary with image URLs or base64 data
            Format: {"images": ["url1", "url2"], "format": "url", "count": 1}
            OR: {"images": ["base64_1", "base64_2"], "format": "base64", "count": 1}
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
            "response_format": response_format,
        }

        # Pre-flight validation
        if not self.api_key or self.api_key.strip() == "":
            error_msg = "MINIMAX_API_KEY is not configured. Please set it in your environment variables."
            logger.error(error_msg)
            return {"error": error_msg, "error_type": "configuration_error", "diagnostic": "API key missing"}
        
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:  # Increased timeout for image generation
                logger.info(
                    f"Generating image - prompt: '{prompt[:100]}...', "
                    f"aspect_ratio: {aspect_ratio}, model: {self.image_model}"
                )
                logger.debug(f"Request endpoint: {endpoint}")
                logger.debug(f"Request payload: {payload}")
                logger.debug(f"API key (masked): {self._mask_api_key(self.api_key)}")
                
                response = await client.post(endpoint, json=payload, headers=self.headers)
                
                logger.debug(f"Response status: {response.status_code}")
                logger.debug(f"Response headers: {dict(response.headers)}")
                
                response.raise_for_status()

                result = response.json()
                logger.info(f"Image generation API response keys: {list(result.keys())}")
                logger.debug(f"Full API response: {result}")
                
                # Check base_resp status first
                base_resp = result.get("base_resp", {})
                status_code = base_resp.get("status_code")
                status_msg = base_resp.get("status_msg", "")
                
                if status_code != 0:
                    error_msg = f"Minimax API error {status_code}: {status_msg}"
                    diagnostic_info = {
                        "api_status_code": status_code,
                        "api_status_msg": status_msg,
                        "endpoint": endpoint,
                        "model": self.image_model,
                        "response_keys": list(result.keys()),
                    }
                    logger.error(
                        f"Image generation failed - {error_msg}. "
                        f"Diagnostic: {diagnostic_info}"
                    )
                    return {
                        "error": error_msg,
                        "error_type": "api_error",
                        "status_code": status_code,
                        "diagnostic": diagnostic_info,
                    }
                
                # Handle successful response format: {"data": {"image_urls": [...]}}
                if "data" in result:
                    data = result["data"]
                    if "image_urls" in data:
                        images = data["image_urls"]
                        return {
                            "images": images if isinstance(images, list) else [images],
                            "format": "url",
                            "count": len(images) if isinstance(images, list) else 1,
                        }
                    elif "image_base64" in data:
                        images = data["image_base64"]
                        return {
                            "images": images if isinstance(images, list) else [images],
                            "format": "base64",
                            "count": len(images) if isinstance(images, list) else 1,
                        }
                    else:
                        error_msg = f"Unexpected data format in API response"
                        diagnostic_info = {
                            "data_keys": list(data.keys()),
                            "expected_keys": ["image_urls", "image_base64"],
                            "response_keys": list(result.keys()),
                            "endpoint": endpoint,
                        }
                        logger.error(f"{error_msg}. Diagnostic: {diagnostic_info}")
                        return {
                            "error": error_msg,
                            "error_type": "unexpected_response_format",
                            "diagnostic": diagnostic_info,
                        }
                else:
                    error_msg = f"API response missing 'data' key"
                    diagnostic_info = {
                        "response_keys": list(result.keys()),
                        "endpoint": endpoint,
                        "full_response": result,
                    }
                    logger.error(f"{error_msg}. Diagnostic: {diagnostic_info}")
                    return {
                        "error": error_msg,
                        "error_type": "missing_response_data",
                        "diagnostic": diagnostic_info,
                    }

        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            http_status = e.response.status_code
            error_msg = f"HTTP {http_status} error"
            diagnostic_info = {
                "http_status_code": http_status,
                "endpoint": endpoint,
                "model": self.image_model,
                "api_key_configured": bool(self.api_key),
                "api_key_masked": self._mask_api_key(self.api_key) if self.api_key else "NOT SET",
            }
            
            try:
                error_json = e.response.json()
                diagnostic_info["error_response"] = error_json
                
                # Try Minimax base_resp format first
                if "base_resp" in error_json:
                    base_resp = error_json["base_resp"]
                    api_status_code = base_resp.get("status_code", "unknown")
                    api_status_msg = base_resp.get("status_msg", "Unknown error")
                    error_msg = f"Minimax API error {api_status_code}: {api_status_msg}"
                    diagnostic_info["api_status_code"] = api_status_code
                    diagnostic_info["api_status_msg"] = api_status_msg
                elif "error" in error_json:
                    if isinstance(error_json["error"], dict):
                        error_msg = error_json["error"].get("message") or error_json["error"].get("msg") or str(error_json["error"])
                    else:
                        error_msg = str(error_json["error"])
                elif "message" in error_json:
                    error_msg = error_json["message"]
                elif "msg" in error_json:
                    error_msg = error_json["msg"]
            except Exception as parse_error:
                logger.warning(f"Could not parse error JSON: {parse_error}")
                diagnostic_info["raw_error_text"] = error_text[:500]  # Limit length
            
            logger.error(
                f"HTTP error during image generation: {http_status} - {error_msg}. "
                f"Diagnostic: {diagnostic_info}"
            )
            logger.debug(f"Full error response text: {error_text}")
            
            return {
                "error": error_msg,
                "error_type": "http_error",
                "status_code": http_status,
                "diagnostic": diagnostic_info,
            }
        except httpx.TimeoutException as e:
            error_msg = "Request timeout - image generation took too long (>180s)"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "timeout",
                "diagnostic": {
                    "endpoint": endpoint,
                    "timeout_seconds": 180,
                },
            }
        except httpx.ConnectError as e:
            error_msg = f"Connection error - could not reach Minimax API"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "connection_error",
                "diagnostic": {
                    "endpoint": endpoint,
                    "base_url": self.base_url,
                    "error": str(e),
                },
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Error generating image: {error_msg}", exc_info=True)
            return {
                "error": error_msg,
                "error_type": "unexpected_error",
                "diagnostic": {
                    "exception_type": type(e).__name__,
                    "endpoint": endpoint,
                },
            }

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

        # Pre-flight validation
        if not self.api_key or self.api_key.strip() == "":
            error_msg = "MINIMAX_API_KEY is not configured. Please set it in your environment variables."
            logger.error(error_msg)
            return {"error": error_msg, "error_type": "configuration_error", "diagnostic": "API key missing"}
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:  # Timeout for video task creation
                logger.info(
                    f"Generating video - prompt: '{prompt[:100]}...', "
                    f"duration: {duration}s, resolution: {resolution}, model: {self.video_model}"
                )
                logger.debug(f"Request endpoint: {endpoint}")
                logger.debug(f"Request payload: {payload}")
                logger.debug(f"API key (masked): {self._mask_api_key(self.api_key)}")
                
                response = await client.post(endpoint, json=payload, headers=self.headers)
                
                logger.debug(f"Response status: {response.status_code}")
                logger.debug(f"Response headers: {dict(response.headers)}")
                
                response.raise_for_status()

                result = response.json()
                logger.info(f"Video generation API response keys: {list(result.keys())}")
                logger.debug(f"Full API response: {result}")
                
                # Check base_resp status first
                base_resp = result.get("base_resp", {})
                status_code = base_resp.get("status_code")
                status_msg = base_resp.get("status_msg", "")
                
                if status_code != 0:
                    error_msg = f"Minimax API error {status_code}: {status_msg}"
                    diagnostic_info = {
                        "api_status_code": status_code,
                        "api_status_msg": status_msg,
                        "endpoint": endpoint,
                        "model": self.video_model,
                        "response_keys": list(result.keys()),
                    }
                    logger.error(
                        f"Video generation failed - {error_msg}. "
                        f"Diagnostic: {diagnostic_info}"
                    )
                    return {
                        "error": error_msg,
                        "error_type": "api_error",
                        "status_code": status_code,
                        "diagnostic": diagnostic_info,
                    }
                
                # Return task_id for polling
                task_id = result.get("task_id")
                if task_id:
                    logger.info(f"Video generation task created: {task_id}")
                    return {"task_id": task_id, "status": "pending"}
                else:
                    error_msg = "No task_id in API response"
                    diagnostic_info = {
                        "response_keys": list(result.keys()),
                        "endpoint": endpoint,
                        "full_response": result,
                    }
                    logger.error(f"{error_msg}. Diagnostic: {diagnostic_info}")
                    return {
                        "error": error_msg,
                        "error_type": "missing_task_id",
                        "diagnostic": diagnostic_info,
                    }

        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            http_status = e.response.status_code
            error_msg = f"HTTP {http_status} error"
            diagnostic_info = {
                "http_status_code": http_status,
                "endpoint": endpoint,
                "model": self.video_model,
                "api_key_configured": bool(self.api_key),
                "api_key_masked": self._mask_api_key(self.api_key) if self.api_key else "NOT SET",
            }
            
            try:
                error_json = e.response.json()
                diagnostic_info["error_response"] = error_json
                
                # Try Minimax base_resp format first
                if "base_resp" in error_json:
                    base_resp = error_json["base_resp"]
                    api_status_code = base_resp.get("status_code", "unknown")
                    api_status_msg = base_resp.get("status_msg", "Unknown error")
                    error_msg = f"Minimax API error {api_status_code}: {api_status_msg}"
                    diagnostic_info["api_status_code"] = api_status_code
                    diagnostic_info["api_status_msg"] = api_status_msg
                elif "error" in error_json:
                    if isinstance(error_json["error"], dict):
                        error_msg = error_json["error"].get("message") or error_json["error"].get("msg") or str(error_json["error"])
                    else:
                        error_msg = str(error_json["error"])
                elif "message" in error_json:
                    error_msg = error_json["message"]
                elif "msg" in error_json:
                    error_msg = error_json["msg"]
            except Exception as parse_error:
                logger.warning(f"Could not parse error JSON: {parse_error}")
                diagnostic_info["raw_error_text"] = error_text[:500]  # Limit length
            
            logger.error(
                f"HTTP error during video generation: {http_status} - {error_msg}. "
                f"Diagnostic: {diagnostic_info}"
            )
            logger.debug(f"Full error response text: {error_text}")
            
            return {
                "error": error_msg,
                "error_type": "http_error",
                "status_code": http_status,
                "diagnostic": diagnostic_info,
            }
        except httpx.TimeoutException as e:
            error_msg = "Request timeout - video task creation took too long (>60s)"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "timeout",
                "diagnostic": {
                    "endpoint": endpoint,
                    "timeout_seconds": 60,
                },
            }
        except httpx.ConnectError as e:
            error_msg = f"Connection error - could not reach Minimax API"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "connection_error",
                "diagnostic": {
                    "endpoint": endpoint,
                    "base_url": self.base_url,
                    "error": str(e),
                },
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Error generating video: {error_msg}", exc_info=True)
            return {
                "error": error_msg,
                "error_type": "unexpected_error",
                "diagnostic": {
                    "exception_type": type(e).__name__,
                    "endpoint": endpoint,
                },
            }

    async def check_task_status(
        self,
        task_id: str,
        media_type: Literal["image", "video"],
    ) -> Optional[dict]:
        """
        Check the status of a generation task.

        NOTE: Image generation is synchronous and does not support status polling.
        This method only works for videos.

        Args:
            task_id: The task ID returned from generate_video (not used for images)
            media_type: Type of media being generated ("image" or "video")

        Returns:
            Dictionary with status and URL if complete, or None if query fails
            Format: {
                "status": "queued|generating|completed|failed",
                "url": "..." (if completed),
                "error": "..." (if failed)
            }
        """
        if media_type == "image":
            logger.error("Image generation is synchronous and does not support status polling")
            return {"error": "Image generation is synchronous and does not support status polling"}
        
        endpoint_map = {
            "video": f"{self.base_url}/query/video_generation",
        }
        endpoint = endpoint_map.get(media_type)

        if not endpoint:
            logger.error(f"Invalid media_type: {media_type}")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:  # Timeout for status check
                response = await client.get(
                    endpoint,
                    params={"task_id": task_id},
                    headers=self.headers,
                )
                response.raise_for_status()

                result = response.json()
                logger.info(f"Video status API response keys: {list(result.keys())}")
                
                # Check base_resp status first
                base_resp = result.get("base_resp", {})
                status_code = base_resp.get("status_code")
                status_msg = base_resp.get("status_msg", "")
                
                if status_code != 0:
                    error_msg = f"API error {status_code}: {status_msg}"
                    logger.error(error_msg)
                    return {"error": error_msg}
                
                # Get status and file_id
                status = result.get("status", "unknown")
                file_id = result.get("file_id")
                
                logger.debug(f"Task {task_id} status: {status}")
                
                # For completed tasks, we need to convert file_id to download URL
                if status == "success" and file_id:
                    # In a real implementation, you might need to call another endpoint
                    # to get the actual download URL using the file_id
                    # For now, we'll return the file_id as the URL placeholder
                    return {
                        "status": "completed",
                        "url": f"{self.base_url}/file/{file_id}",  # This might need adjustment
                        "file_id": file_id
                    }
                elif status == "failed":
                    return {
                        "status": "failed",
                        "error": "Video generation failed"
                    }
                else:
                    return {
                        "status": status,
                        "task_id": task_id
                    }

        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            http_status = e.response.status_code
            error_msg = f"HTTP {http_status} error"
            diagnostic_info = {
                "http_status_code": http_status,
                "endpoint": endpoint,
                "task_id": task_id,
                "api_key_configured": bool(self.api_key),
            }
            
            try:
                error_json = e.response.json()
                diagnostic_info["error_response"] = error_json
                
                if "base_resp" in error_json:
                    base_resp = error_json["base_resp"]
                    api_status_code = base_resp.get("status_code", "unknown")
                    api_status_msg = base_resp.get("status_msg", "Unknown error")
                    error_msg = f"Minimax API error {api_status_code}: {api_status_msg}"
                    diagnostic_info["api_status_code"] = api_status_code
                    diagnostic_info["api_status_msg"] = api_status_msg
            except Exception:
                diagnostic_info["raw_error_text"] = error_text[:500]
            
            logger.error(
                f"HTTP error checking task status: {http_status} - {error_msg}. "
                f"Diagnostic: {diagnostic_info}"
            )
            return {
                "error": error_msg,
                "error_type": "http_error",
                "status_code": http_status,
                "diagnostic": diagnostic_info,
            }
        except httpx.TimeoutException as e:
            error_msg = "Request timeout - status check took too long (>30s)"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "timeout",
                "diagnostic": {
                    "endpoint": endpoint,
                    "task_id": task_id,
                    "timeout_seconds": 30,
                },
            }
        except httpx.ConnectError as e:
            error_msg = f"Connection error - could not reach Minimax API"
            logger.error(f"{error_msg}: {str(e)}")
            return {
                "error": error_msg,
                "error_type": "connection_error",
                "diagnostic": {
                    "endpoint": endpoint,
                    "base_url": self.base_url,
                    "task_id": task_id,
                    "error": str(e),
                },
            }
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Error checking task status: {error_msg}", exc_info=True)
            return {
                "error": error_msg,
                "error_type": "unexpected_error",
                "diagnostic": {
                    "exception_type": type(e).__name__,
                    "endpoint": endpoint,
                    "task_id": task_id,
                },
            }

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
        response_format: Literal["base64", "url"] = "url",
    ) -> Optional[str]:
        """
        Generate an image and return the URL.

        Since image generation is synchronous, this just calls generate_image
        and returns the first image URL.

        Args:
            prompt: Text description of the image
            aspect_ratio: Image aspect ratio
            response_format: "url" for URLs or "base64" for base64 strings

        Returns:
            URL of first generated image, or None if failed
        """
        result = await self.generate_image(prompt, aspect_ratio, response_format=response_format)
        
        if result and "error" not in result:
            images = result.get("images", [])
            if images:
                if result.get("format") == "url":
                    return images[0]  # Return first URL
                elif result.get("format") == "base64":
                    # If base64, we could convert to data URL, but for now return None
                    # and let the caller handle base64 separately
                    logger.warning("Base64 format not yet supported for direct URL return")
                    return None
        
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
