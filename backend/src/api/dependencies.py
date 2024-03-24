# Standard library imports.
import os

from openai import AzureOpenAI

# Local libraries
from ..services.ChatBotPipeline import ChatBotPipeline
from ..utils.embeddings_generator import OpenAiEmbeddingsGenerator
from ..utils.text_searcher import AzureTextSearcher
from ..utils.text_generator import AzureOpenAITextGenerator


async def get_chat_bot_service():

    # define embedding client
    openai_embedding_client = AzureOpenAI(
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_KEY"),
        api_version="2023-09-01-preview"
    )

    # define embeddings generator
    embedding_generator = OpenAiEmbeddingsGenerator(client=openai_embedding_client,
                                                    embeddings_model=os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT"))

    # define text searcher
    azure_text_searcher = AzureTextSearcher(
        endpoint=os.getenv("AZURE_SEARCH_ENPOINT"),
        index_name=os.getenv("AZURE_SEARCH_INDEX_NAME"),
        search_key=os.getenv("AZURE_SEARCH_KEY"),
        embedding_generator=embedding_generator
    )

    # define text generator
    azure_openai_text_generator = AzureOpenAITextGenerator(azure_endpoint=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
                                                           api_key=os.getenv("AZURE_OPENAI_KEY"),
                                                           model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
                                                           temperature=0,
                                                           max_response_tokens=300)

    return ChatBotPipeline(text_searcher=azure_text_searcher,
                           text_generator=azure_openai_text_generator)
