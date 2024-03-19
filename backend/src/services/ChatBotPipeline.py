from typing import Union
from openai import AsyncAzureOpenAI, AzureOpenAI
from azure.search.documents.aio import SearchClient
from azure.search.documents.models import VectorizedQuery
import os
import json
from fastapi.encoders import jsonable_encoder
from ..models.request import ChatRequest
from fastapi.responses import JSONResponse, StreamingResponse, Response
import tiktoken
from ..models.response import ChatResponse


class ChatBotPipeline:
    def __init__(
            self,
            search_client: SearchClient,
            openai_client: AsyncAzureOpenAI,
            openai_embedding_client: AzureOpenAI,
            model,
            embeddings_model
        ):
        self.search_client = search_client
        self.openai_client = openai_client
        self.openai_embedding_client = openai_embedding_client
        self.model = model
        self.embeddings_model = embeddings_model
        self.model_token_limit = 8194
        self.max_response_tokens = 300  #Pending

        self.reasoning_thread = []

    def process_request(self, chat_request: ChatRequest):
        chat_stream = chat_request.stream
        user_message = jsonable_encoder(chat_request.message)
        user_query = user_message[0]["content"]
        return chat_stream, user_query
    
    def num_tokens_from_messages(self, messages: list) -> int:
        """Returns the number of tokens in a message list."""
        encoding = tiktoken.encoding_for_model('gpt-4')
        num_tokens = 0
        for message in messages:
            num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
            for key, value in message.items():
                num_tokens += len(encoding.encode(value))
                if key == "name":  # if there's a name, the role is omitted
                    num_tokens += -1  # role is always required and always 1 token
        num_tokens += 2  # every reply is primed with <im_start>assistant
        return num_tokens
    
    def sys_prompt(self):
        content = """
        You are a Swiss legal expert. Please only answer Swiss legal questions, for other irrelevant question, just say 'Your question is out of scope.' Use the pieces of Swiss law provided in the Swiss law retrieval result to answer the user question. You should only use the Swiss law retrieval result for your answer. Your answer must be based on the Swiss law retrieval result. If the Swiss law retrieval result does not contain the exact answer to the exact question, just say that 'I don't know', don't try to make up an answer if it is not fully clear from the Swiss law retrieval result. Explain your answer and refer the exact source / article of the Swiss law retrieval result sentence by sentence.
        """
        sys_message = [{"role":"system","content":content}]

        return sys_message, self.num_tokens_from_messages(sys_message)
    
    def user_prompt(self, retrieved_info: dict) -> str:
        retrieved_text = retrieved_info["text"]
        prompt = f"""
        Swiss law retrieval result:
        {retrieved_text}
        """
        return prompt
    
    
    async def retriever(
            self,
            user_query: str,
        ) -> dict:
        retrieved_info = {}
        retrieved_info["eIds"] = []
        retrieved_info["text"] = []
        retrieved_info["metadata"] = []
        
        results = await self.search_client.search(
            search_text=user_query,
            vector_queries=[VectorizedQuery(
                vector=(await self.openai_embedding_client.embeddings.create(input=[user_query], model=self.embeddings_model)).data[0].embedding, 
                k_nearest_neighbors=3, fields="text_vector")],
            top=5,
            select=["text", "metadata", "eIds"],
            include_total_count=True)   
        
        async for result in results:
            retrieved_info["eIds"].append(result["eIds"])
            retrieved_info["text"].append(result["metadata"][1][:-1] + result["text"])
            retrieved_info["metadata"].append(result["metadata"])
        self.reasoning_thread.append({"type": "search", "query": user_query, "results": retrieved_info})
        return retrieved_info


    async def generator(
            self,
            user_query,
            prompt,
            chat_stream
        ) -> Union[StreamingResponse, Response]:
        # Set up LLM model
        temperature = 0.0
        sys_message, sys_message_tokens = self.sys_prompt()
        user_content = user_query + " " + prompt
        user_message = [{"role":"user", "content":user_content}]
        user_message_tokens = self.num_tokens_from_messages(user_message)
        user_message_token_limit = self.model_token_limit - self.max_response_tokens - sys_message_tokens
        conversation = sys_message + user_message

        if chat_stream:
            #Streaming response
                async def response_stream():
                    full_response = ""
                    chat_coroutine = self.openai_client.chat.completions.create(
                        model=self.model,
                        temperature=temperature,
                        messages=conversation,
                        max_tokens=self.max_response_tokens,
                        stream=True,
                    )
                    async for event in await chat_coroutine:
                        if event.choices:
                            content = json.dumps(event.choices[0].delta.content, ensure_ascii=False)
                            if event.choices[0].finish_reason != "stop":
                                if content != "null":
                                    content = eval(content)
                                    full_response += content
                                    data = {"content": content, "reasoning_thread":"null"}
                                    sse_data = f"data: {jsonable_encoder(ChatResponse(data=data))}\n\n"
                                    yield sse_data
                            else:
                                self.reasoning_thread.append({"type": "llm", "prompt":conversation, "response": full_response})
                                data = {"content": content, "reasoning_thread":self.reasoning_thread}
                                sse_data = f"data: {jsonable_encoder(ChatResponse(data=data))}\n\n"
                                yield sse_data
                return StreamingResponse(response_stream(), media_type="text/event-stream")
        else:
            #Non-Streaming Response
            gpt_message = await self.openai_client.chat.completions.create(
                model=self.model,
                temperature=temperature,
                messages=conversation,
                max_tokens=self.max_response_tokens,
                stream=False,
            )
            content = gpt_message.choices[0].message.content
            self.reasoning_thread.append({"type": "llm", "prompt":conversation, "response": content})
            data = {"content": content, "reasoning_thread": self.reasoning_thread}
            response = jsonable_encoder(ChatResponse(data=data))
        return JSONResponse(response, media_type="application/json")
        
    async def run(
            self, 
            chat_request: ChatRequest
        ) -> Union[StreamingResponse, Response]:
        chat_stream, user_query = self.process_request(chat_request)       
        retrieved_info = await self.retriever(user_query)
        prompt = self.user_prompt(retrieved_info)
        response = await self.generator(user_query, prompt, chat_stream)
        return response
    

