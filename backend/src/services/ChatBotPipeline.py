from typing import Union, List
from collections import defaultdict

import json
from fastapi.encoders import jsonable_encoder
from ..models.request import ChatRequest, UserMessage
from fastapi.responses import JSONResponse, StreamingResponse, Response
from ..models.response import ChatResponse
from ..utils.text_searcher import TextSearcherBase
from ..utils.text_generator import TextGeneratorBase
from ..utils.helpers import (
    get_sys_prompt,
    get_user_prompt,
    num_tokens_from_messages
)
from ..utils.prompts import sys_prompt_content


class ChatBotPipeline:
    def __init__(
            self,
            text_searcher: TextSearcherBase,
            text_generator: TextGeneratorBase
    ):
        self.text_searcher = text_searcher
        self.text_generator = text_generator
        self.reasoning_thread = []

    @staticmethod
    def _process_request(user_messages: List[UserMessage]):
        user_message = jsonable_encoder(user_messages)
        user_query = user_message[0]["content"]
        return user_query

    async def _retriever(
            self,
            user_query: str,
    ) -> dict:

        retrieved_info = defaultdict(list)

        results = await self.text_searcher.search(
            user_query=user_query,
            n_top_results=5
        )

        async for result in results:
            retrieved_info["eIds"].append(result["eIds"])
            retrieved_info["text"].append(result["text"])
            retrieved_info["metadata"].append(result["metadata"])
        self.reasoning_thread.append({"type": "search", "query": user_query, "results": retrieved_info})
        return retrieved_info

    async def _generator(
            self,
            user_query: str,
            user_prompt: str,
            is_chat_stream: bool
    ) -> Union[StreamingResponse, Response]:
        # Set up LLM model
        sys_message = get_sys_prompt(sys_prompt_content)
        sys_message_tokens = num_tokens_from_messages(sys_message)
        user_content = user_query + " " + user_prompt
        user_message = [{"role": "user", "content": user_content}]
        #user_message_tokens = num_tokens_from_messages(user_message)
        #user_message_token_limit = self.model_token_limit - self.max_response_tokens - sys_message_tokens
        conversation = sys_message + user_message

        if is_chat_stream:
            # Streaming response
            async def response_stream():
                full_response = ""
                async for event in await self.text_generator.stream_generator(conversation):
                    if event.choices:
                        content = json.dumps(event.choices[0].delta.content, ensure_ascii=False)
                        if event.choices[0].finish_reason != "stop":
                            if content != "null":
                                content = eval(content)
                                full_response += content
                                data = {"content": content, "reasoning_thread": "null"}
                                sse_data = f"data: {jsonable_encoder(ChatResponse(data=data))}\n\n"
                                yield sse_data
                        else:
                            self.reasoning_thread.append(
                                {"type": "llm", "prompt": conversation, "response": full_response})
                            data = {"content": content, "reasoning_thread": self.reasoning_thread}
                            sse_data = f"data: {jsonable_encoder(ChatResponse(data=data))}\n\n"
                            yield sse_data

            return StreamingResponse(response_stream(), media_type="text/event-stream")
        else:
            # Non-Streaming Response
            content = await self.text_generator.generate_message(conversation)
            self.reasoning_thread.append({"type": "llm", "prompt": conversation, "response": content})
            data = {"content": content, "reasoning_thread": self.reasoning_thread}
            response = jsonable_encoder(ChatResponse(data=data))
        return JSONResponse(response, media_type="application/json")

    async def run(
            self,
            chat_request: ChatRequest
    ) -> Union[StreamingResponse, Response]:

        # define user query
        user_query = self._process_request(chat_request.message)

        # retrieve related documents
        retrieved_info = await self._retriever(user_query)

        # define user promt based
        user_prompt = get_user_prompt(retrieved_info["text"])

        # generate response
        response = await self._generator(user_query, user_prompt, chat_request.stream)

        return response
