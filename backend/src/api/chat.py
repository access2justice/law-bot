from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from ..models.request import ChatRequest
from ..services.ChatBotPipeline import ChatBotPipeline
from ..services.globals import clients
import os


router = APIRouter()

@router.post("/chat")
async def chat_handler(chat_request: ChatRequest):
    search_client = clients["azure_search"]
    openai_client = clients["azure_openai"]
    embed_client = clients["azure_embedding"]
    model = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    embeddings_model = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
    chatbot = ChatBotPipeline(search_client, openai_client, embed_client, model, embeddings_model)
    response = await chatbot.run(chat_request)
    return JSONResponse(content=jsonable_encoder(response))
    