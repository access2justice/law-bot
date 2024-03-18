from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import traceback
from .globals import logger
from fastapi.responses import JSONResponse

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Exception caught: {exc}\n{traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"message": "An internal server error occurred."}
            )

