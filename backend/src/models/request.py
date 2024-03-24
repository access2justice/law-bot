from typing import List

from pydantic import BaseModel


class UserMessage(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    message: List[UserMessage]
    stream: bool = False
