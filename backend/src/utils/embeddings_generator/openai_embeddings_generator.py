from typing import List

from openai import AzureOpenAI

from .embeddings_generator_base import EmbeddingsGeneratorBase


class OpenAiEmbeddingsGenerator(EmbeddingsGeneratorBase):
    def __init__(self, client: AzureOpenAI, embeddings_model: str) -> None:
        self._client = client
        self._embeddings_model = embeddings_model

    async def generate(self, input: List[str]): # TODO ADD return type
        embeddings_gen = await self._client.embeddings.create(input=input, model=self._embeddings_model)
        return embeddings_gen.data[0].embedding
