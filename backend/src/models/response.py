from typing import Any, Dict, Optional, Union, List
from pydantic import BaseModel

class ReasoningThread(BaseModel):
    type: str
    results: Optional[Dict[str, Any]]
    query: Optional[Any]
    conversation: Optional[Any]
    response: Optional[str]

class MyJsonType(BaseModel):
    content: str
    reasoning_thread: List[ReasoningThread]

class ChatResponse(BaseModel):
    data: Any

