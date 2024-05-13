#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Apr  5 16:36:44 2024

@author: paulina
"""

from dotenv import load_dotenv
import os

# Common data processing
import json
import textwrap

# Langchain
from langchain_community.graphs import Neo4jGraph
from langchain_community.vectorstores import Neo4jVector
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQAWithSourcesChain,RetrievalQA
from langchain_openai import ChatOpenAI


# Warning control
import warnings
warnings.filterwarnings("ignore")

NEO4J_URI="NEO4J_URI"
NEO4J_USERNAME="NEO4J_USERNAME"
NEO4J_PASSWORD="NEO4J_PASSWORD"
AURA_INSTANCEID="AURA_INSTANCEID"
AURA_INSTANCENAME="AURA_INSTANCENAME"
DATABASE_NAME="DATABASE_NAME"

OPENAI_API_KEY = "OPENAI_API_KEY"
OPENAI_ENDPOINT = "OPENAI_ENDPOINT"

VECTOR_INDEX_NAME = 'articles'
VECTOR_NODE_LABEL = 'Article'
VECTOR_SOURCE_PROPERTY = 'text'
VECTOR_EMBEDDING_PROPERTY = 'embedding_arts'

kg = Neo4jGraph(
    url=NEO4J_URI, username=NEO4J_USERNAME, password=NEO4J_PASSWORD, database=DATABASE_NAME
)

kg.query("""
                  MATCH (n) DETACH DELETE n
         """)

file_name = "./obligationrecht_by_article.json"
file_as_object = json.load(open(file_name))

new_list=[]
idx=0
for art in file_as_object:
    print(idx,art["metadata"])
    new_list.append({"idx":idx,
                     "text":art["text"],
                     "link":art["metadata"][0],
                    "metadata": ";".join(art["metadata"][1:-1]),
                     "art":art["metadata"][-1]
                     })
    idx+=1


merge_node_query = """
MERGE(mergedArt:Article {artId: $artParam.idx})
    ON CREATE SET 
        mergedArt.text = $artParam.text,
        mergedArt.link = $artParam.link, 
        mergedArt.art = $artParam.art, 
        mergedArt.metadata = $artParam.metadata
RETURN mergedArt
"""
kg.query(merge_node_query, 
         params={'artParam':new_list[0]})

kg.query("""
CREATE CONSTRAINT unique_art IF NOT EXISTS 
    FOR (mergedArt:Article) REQUIRE mergedArt.artId IS UNIQUE
""")

kg.query("SHOW INDEXES")

node_count = 0
for art in new_list:
    print(f"Creating `:Chunk` node for art  {art['idx']}")
    kg.query(merge_node_query, 
            params={
                'artParam': art
            })
    node_count += 1
print(f"Created {node_count} nodes")


from langchain.vectorstores.neo4j_vector import Neo4jVector
from langchain.embeddings.openai import OpenAIEmbeddings


vector_index = Neo4jVector.from_existing_graph(
    OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY),
    url=NEO4J_URI,
    username=NEO4J_USERNAME,
    password=NEO4J_PASSWORD,
    index_name=VECTOR_INDEX_NAME,
    node_label=VECTOR_NODE_LABEL,
    text_node_properties=['art', 'text', 'metadata',"link"],
    embedding_node_property= VECTOR_EMBEDDING_PROPERTY,
    search_type="hybrid",
)

response = vector_index.similarity_search(
    "Auf wie viele Ferientagen pro Jahr habe ich Anspruch?"
)



def neo4j_vector_search(question):
  """Search for similar nodes using the Neo4j vector index"""
  vector_search_query = """
    WITH genai.vector.encode(
      $question, 
      "OpenAI", 
      {
        token: $openAiApiKey,
        endpoint: $openAiEndpoint
      }) AS question_embedding
    CALL db.index.vector.queryNodes($index_name, $top_k, question_embedding) yield node, score
    RETURN score, node.text, node.art AS text
  """
  similar = kg.query(vector_search_query, 
                     params={
                      'question': question, 
                      'openAiApiKey':OPENAI_API_KEY,
                      'openAiEndpoint': OPENAI_ENDPOINT,
                      'index_name':VECTOR_INDEX_NAME, 
                      'top_k': 10})
  return similar

###### Questions ######




from langchain.chains import RetrievalQA,GraphCypherQAChain
from langchain.chat_models import ChatOpenAI
vectorstore_retriver_args = {
            "k": 1,
        
        }
vector_qa = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(openai_api_key=OPENAI_API_KEY,temperature=0,model_name="gpt-3.5-turbo"),
    chain_type="stuff",
    
    retriever=vector_index.as_retriever(),#search_kwargs=vectorstore_retriver_args),
    verbose=True,
   #return_source_document =True
    
)

############
question = "Kann meine mühsame Untermieterin den auf ein Jahr befristeten Untermietvertrag für die Wohnung vorzeitig auflösen, wenn keine Unzumutbarkeit oder wichtigen Gründe vorliegen? Sie erwähnt, dass sie einen zumutbaren Nachmieter gefunden hat und ich sie deshalb aus dem Mietverhältnis entlassen muss."

prompt="""Benutze die bereitgestellten Informationen, um die Frage des Benutzers zu beantworten.
Wenn du die Antwort nicht kennst, sag einfach, dass du es nicht weisst, und versuche nicht, eine Antwort zu erfinden. Achte auf den Wohnsitz und ob die Schweizer Recht angewendet werden kann.


Question: {}

Schreibe in deiner Antwort die Artikel an, in dem du die Antwort gefunden hast. Schreibe am Text Ende also die URL-Links zu den Quellen Artikeln""".format(question)
vector_qa.run(
    question
)

response = vector_index.similarity_search(
    question)
print(response[0].page_content)
#vector_qa.metadata
vector_index.get_relevant_documents(question)
#neo4j_vector_search(question)




