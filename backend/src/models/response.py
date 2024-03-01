from typing import Any, Dict, Union
from pydantic import BaseModel

class ChatResponse(BaseModel):
    data: MyJsonType

class ReasoningThread:
    type: str
    results: Dict[str, Any]
    conversation: Dict[str, Any]
    response: str

class MyJsonType:
    content: str
    reasoning_thread: ReasoningThread