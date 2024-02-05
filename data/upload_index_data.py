import os
import openai
import pandas as pd

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

load_dotenv(override=True)

service_endpoint = os.getenv('AZURE_SEARCH_ENDPOINT')
index_name = os.getenv('AZURE_SEARCH_INDEX_NAME')
key = os.getenv('AZURE_SEARCH_KEY')
open_ai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
open_ai_key = os.getenv('AZURE_OPENAI_KEY')
deployment_name = os.getenv('AZURE_EMBEDDING_DEPLOYMENT_NAME')


def get_embeddings(text: str):
    """
    Create article embeddings
    """
    client = openai.AzureOpenAI(
        azure_endpoint=open_ai_endpoint,
        api_key=open_ai_key,
        api_version="2023-07-01-preview",
    )
    embedding = client.embeddings.create(input=[text], model=deployment_name)

    return embedding.data[0].embedding


def prep_data(json_file_name: str):
    """
    Prepare dataset for upload to Azure index
    """
    # Reformat data to {text, metadata} structure
    docs = pd.read_json(f'{json_file_name}.json')
    docs['metadata'] = docs['Level1'] + ";" + docs['art']
    docs = docs.drop(columns=['Level1', 'art', 'p_num'])
    documents = docs.to_dict('records')

    # Prepare data for upload
    docs = []
    counter = 1
    for document in documents[:1]:
        document['metadata'] = document['metadata'].split(';')
        DOCUMENT = {
            "@search.action": "mergeOrUpload",
            "id": str(counter),
            "text": document['p_text'],
            "text_vector": get_embeddings(document['p_text']),
            "metadata": document['metadata']
        }
        counter += 1
        docs.append(DOCUMENT)
    
    return docs


if __name__ == "__main__":
    docs = prep_data('cleaned_pflichten_des_arbeitsgebers')
    client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))
    print(f"Number of docs to upload: {len(docs)}")
    result = client.upload_documents(docs)
    print(f"Succeeded: {result[0].succeeded}")