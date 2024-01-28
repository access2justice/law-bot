from fastapi import APIRouter
from ..models.request import ChatRequest
from ..services.ChatBotPipeline import ChatBotPipeline
from ..services.globals import clients
import os


router = APIRouter()

@router.post("/chat")
async def chat_handler(chat_request: ChatRequest):
    search_client = clients["azure_search"]
    openai_client = clients["azure_openai"]
    model = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    chatbot = ChatBotPipeline(search_client, openai_client, model)
    response = await chatbot.run(chat_request)
    return response
    