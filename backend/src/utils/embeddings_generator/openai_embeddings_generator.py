from typing import List

from openai import AsyncAzureOpenAI

from .embeddings_generator_base import EmbeddingsGeneratorBase


class OpenAiEmbeddingsGenerator(EmbeddingsGeneratorBase):
    def __new__(cls, client: AsyncAzureOpenAI, embeddings_model: str, *args, **kwargs):
        instance = super(OpenAiEmbeddingsGenerator, cls).__new__(cls, *args, **kwargs)
        return instance

    def __init__(self, client: AsyncAzureOpenAI, embeddings_model: str) -> None:
        self._client = client
        self._embeddings_model = embeddings_model

    async def generate(self, input_text: List[str]) -> List[float]:  # TODO ADD return type
        embeddings_gen = await self._client.embeddings.create(input=input_text, model=self._embeddings_model)
        return embeddings_gen.data[0].embedding
