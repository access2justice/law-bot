import pandas as pd

from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

service_name = "YOUR_AZURE_SERVICE_NAME"
index_name = "YOUR_AZURE_INDEX_NAME"
key = "YOUR_AZURE_AUTH_KEY"

service_endpoint = f'https://{service_name}.search.windows.net'
search_client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))


# Reformat data to {text, metadata} structure
docs = pd.read_json('cleaned_pflichten_des_arbeitsgebers.json')
docs['metadata'] = docs['Level1'] + ";" + docs['art']
docs = docs.drop(columns=['Level1', 'art', 'p_num'])
documents = docs.to_dict('records')

# Prepare data for upload
docs = []
counter = 1
for document in documents:
    document['metadata'] = document['metadata'].split(';')
    DOCUMENT = {
        "@search.action": "upload",
        "id": index_name,
        "doc_id": counter,
        "text": document['p_text'],
        "metadata": document['metadata']
    }
    counter += 1
    docs.append(DOCUMENT)

# Upload data
result = search_client.upload_documents(documents=docs)
print(f"Succeeded: {result[0].succeeded}")

# Check if data is in index
results = search_client.search(search_text="*", include_total_count=True)
print ('Total Documents Matching Query:', results.get_count())
for result in results:
    print("{}: {}".format(result["doc_id"], result["metadata"][1]))