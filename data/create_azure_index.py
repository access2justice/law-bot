import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient

from azure.search.documents.indexes.models import (
    SearchIndex,
    SearchField,
    SearchFieldDataType,
    SearchableField,
    VectorSearch,
    VectorSearchProfile,
    HnswAlgorithmConfiguration
)

load_dotenv(override=True)

service_endpoint = os.getenv('AZURE_SEARCH_ENDPOINT')
index_name = os.getenv('AZURE_SEARCH_INDEX_NAME')
key = os.getenv('AZURE_SEARCH_KEY')

def get_lawbot_index(name: str):
    """ Function to create the lawbot index """
    fields = [
        SearchField(
            name="id", type=SearchFieldDataType.String, key=True,
            searchable=True,
            sortable=True,
            filterable=True,
            facetable=True
        ),
        SearchableField(
            name="text", 
            type=SearchFieldDataType.String,
            searchable=True,
            sortable=True,
            filterable=True,
            facetable=True
        ),
        SearchField(
            name="metadata",
            type=SearchFieldDataType.Collection(SearchFieldDataType.String),
            searchable=True,
            filterable=True,
            facetable=True
        ),
        SearchField(
            name="text_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=1536,
            vector_search_profile_name="lawbot-vector-config",
        )
    ]
    vector_search = VectorSearch(
        profiles=[VectorSearchProfile(name="lawbot-vector-config", algorithm_configuration_name="lawbot-algorithms-config")],
        algorithms=[HnswAlgorithmConfiguration(name="lawbot-algorithms-config")],
    )
    return SearchIndex(name=name, fields=fields, vector_search=vector_search)


if __name__ == "__main__":
    index = get_lawbot_index(index_name)
    index_client = SearchIndexClient(service_endpoint, AzureKeyCredential(key))
    index_client.create_index(index)