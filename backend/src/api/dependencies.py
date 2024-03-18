# Standard library imports.
import os

# Local libraries
from ..services.globals import clients
from ..services.ChatBotPipeline import ChatBotPipeline
from ..utils.embeddings_generator import OpenAiEmbeddingsGenerator


async def get_chat_bot_service():
    search_client = clients["azure_search"]
    openai_client = clients["azure_openai"]
    embed_client = clients["azure_embedding"]
    model = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    embeddings_model = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
    embed_client = OpenAiEmbeddingsGenerator(client=embed_client, embeddings_model=embeddings_model)
    return ChatBotPipeline(search_client, openai_client, embed_client, model)
