from pydantic import BaseModel

class UserMessage(BaseModel):
    role: str = "user"
    content: str

class ChatRequest(BaseModel):
    message: list[UserMessage]
    stream: bool = False