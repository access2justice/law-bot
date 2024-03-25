# Standard library imports.
from typing import Annotated

# Installed libraries
from fastapi import APIRouter, Depends

# Local libraries
from ..models.request import ChatRequest
from ..services.ChatBotPipeline import ChatBotPipeline
from .dependencies import get_chat_bot_service

# create router
router = APIRouter(prefix="/chat", tags=["chat"])

# get dependency
ChatBotPipelineService = Annotated[ChatBotPipeline, Depends(get_chat_bot_service)]


@router.post("/query")
async def chat_handler(chat_request: ChatRequest, chatbot: ChatBotPipelineService):
    response = await chatbot.run(chat_request)
    return response
