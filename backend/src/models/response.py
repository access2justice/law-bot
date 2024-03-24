from typing import Any, Dict, Optional, Union, List

from pydantic import BaseModel


class ReasoningThread(BaseModel):
    type: str
    query: Optional[Any] = None
    results: Optional[Dict[str, Any]] = None
    prompt: Optional[Any] = None
    response: Optional[str] = None


class IntegratedResponse(BaseModel):
    content: str
    reasoning_thread: Union[str, List[ReasoningThread]]


class ChatResponse(BaseModel):
    data: IntegratedResponse
