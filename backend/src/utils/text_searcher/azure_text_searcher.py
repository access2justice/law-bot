from typing import Any

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorizedQuery

from .text_searcher_base import TextSearcherBase
from src.utils.embeddings_generator import EmbeddingsGeneratorBase


class AzureTextSearcher(TextSearcherBase):

    def __new__(cls,
                endpoint: str,
                index_name: str,
                search_key: str,
                embedding_generator: EmbeddingsGeneratorBase,
                n_top_results: int,
                *args,
                **kwargs):
        instance = super(AzureTextSearcher, cls).__new__(cls, *args, **kwargs)
        return instance

    def __init__(self,
                 endpoint: str,
                 index_name: str,
                 search_key: str,
                 embedding_generator: EmbeddingsGeneratorBase,
                 n_top_results: int
                 ):
        self._embedding_generator = embedding_generator

        # define azure search client
        self._search_client = SearchClient(
            endpoint=endpoint,
            index_name=index_name,
            credential=AzureKeyCredential(search_key)
        )

        self._n_top_results = n_top_results

    # TODO check vectorizedQuery

    async def search(self, user_query: str) -> Any:
        return await self._search_client.search(
            search_text=user_query,
            vector_queries=[VectorizedQuery(
                vector=await self._embedding_generator.generate(input_text=[user_query]),
                k_nearest_neighbors=3, fields="text_vector")],
            top=self._n_top_results,
            select=["text", "metadata", "eIds"],
            include_total_count=True)
