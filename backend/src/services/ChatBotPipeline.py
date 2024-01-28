from typing import Union
from openai import AsyncAzureOpenAI
from azure.search.documents.aio import SearchClient
import os
import json
from fastapi.encoders import jsonable_encoder
from ..models.request import ChatRequest
from fastapi.responses import StreamingResponse, Response


class ChatBotPipeline:
    def __init__(
            self,
            search_client: SearchClient,
            openai_client: AsyncAzureOpenAI,
            model,
        ):
        self.search_client = search_client
        self.openai_client = openai_client
        self.model = model

    def process_request(self, chat_request: ChatRequest):
        chat_stream = chat_request.stream
        user_message = jsonable_encoder(chat_request.message)
        user_query = user_message[0]["content"]
        return chat_stream, user_message, user_query

    def system_prompt(self, retrieved_info: dict) -> str:
        retrieved_text = retrieved_info["text"]
        retrieved_art_num = retrieved_info["art_num"]
        prompt = f"""
        You are a Swiss legal assistant.
        Summarize your answer based on the context and reference law provided, and also your own knowledge base.
        Context: {retrieved_text}
        Reference law: {retrieved_art_num}
        """
        return prompt
    
    async def retriever(
            self,
            user_query: str,
        ) -> dict:
        retrieved_info = {}
        retrieved_info["text"] = []
        retrieved_info["art_num"] = []
        results = await self.search_client.search(
            search_text=user_query,
            top=5,
            include_total_count=True)
        async for result in results:
            retrieved_info["text"].append(result["text"])
            retrieved_info["art_num"].append(result["metadata"][1])
            # print("Result:")
            # print("       Text:{}:\n ".format(result["text"]))
            # print("       Art_Num:{}:\n".format(result["metadata"][1]))
            # print("-------------")
        return retrieved_info

    async def generator(
            self,
            user_message,
            prompt,
            chat_stream,
        ) -> Union[StreamingResponse, Response]:
        # Set up LLM model
        #model = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
        sys_message = [{"role":"system","content":prompt}]
        message = sys_message + user_message
        temperature = 0.2
        if chat_stream:
            #Streaming response
                async def response_stream():
                    chat_coroutine = self.openai_client.chat.completions.create(
                        model=self.model,
                        temperature=temperature,
                        messages=message,
                        stream=True,
                    )
                    async for event in await chat_coroutine:
                        if event.choices:
                            yield json.dumps(event.choices[0].delta.content, ensure_ascii=False)
                return StreamingResponse(response_stream(), media_type="text/event-stream")
        else:
            #Non-Streaming Response
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                temperature=temperature,
                messages=message,
                stream=False,
            )
        return Response(response.choices[0].message.content, media_type="text/plain")
        
    async def run(
            self, 
            chat_request: ChatRequest
        ) -> Union[StreamingResponse, Response]:
        chat_stream, user_message, user_query = self.process_request(chat_request)
        retrieved_info = await self.retriever(user_query)
        prompt = self.system_prompt(retrieved_info)
        response = await self.generator(user_message, prompt, chat_stream)
        return response
    

