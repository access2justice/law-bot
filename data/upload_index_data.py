import os
import json
import openai

from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchIndexingBufferedSender

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
    f = open(f'{json_file_name}.json')
    # returns JSON object as a dictionary
    documents = json.load(f)

    # Prepare data for upload
    docs = []
    counter = 1
    for document in documents:
        if 'text' in document and document['text']:
            DOCUMENT = {
                "@search.action": "mergeOrUpload",
                "id": str(counter),
                "text": document['text'],
                "text_vector": get_embeddings(document['text']),
                "metadata": document['metadata'],
                "eIds": document['@eIds']
            }
            counter += 1
            docs.append(DOCUMENT)
    
    return docs


if __name__ == "__main__":
    # prepare documents for azure index
    docs = prep_data('obligationrecht_by_article')
    # chunk documents
    chunks = [docs[i:i + 1000] for i in range(0, len(docs), 1000)]
    # upload chunks to azure
    for chunk in chunks:
        # Use SearchIndexingBufferedSender to upload the documents in batches optimized for indexing  
        with SearchIndexingBufferedSender(  
            endpoint=service_endpoint,  
            index_name=index_name,  
            credential=AzureKeyCredential(key),  
        ) as batch_client:  
            # Add upload actions for all documents  
            batch_client.upload_documents(documents=chunk)  
    print(f"Uploaded {len(docs)} documents in total")
