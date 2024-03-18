from pydantic import BaseModel

class UserMessage(BaseModel):
    role: str = "user"
    content: str
    class Config:
        extra = "forbid"

class ChatRequest(BaseModel):
    message: list[UserMessage]
    stream: bool = False
    class Config:
        extra = "forbid"