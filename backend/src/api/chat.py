from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
from ..models.request import ChatRequest
import json
from fastapi.encoders import jsonable_encoder
import os
from .globals import clients
from typing import Dict, List, cast

router = APIRouter()

@router.post("/chat")
async def chat_handler(chat_request: ChatRequest):

    # Search documents, TBC
    async with clients["azure_search"]:
       results = await clients["azure_search"].search(search_text="vacation", facets=["text"])
       facets: Dict[str, List[str]] = cast(Dict[str, List[str]], await results.get_facets())
       for facet in facets["text"]:
           print("{}".format(facet))

    # Set up LLM model
    model = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    prompt = [{"role":"system","content":"You are a Swiss legal assistant."}]
    message = prompt + jsonable_encoder(chat_request.message)

    if chat_request.stream:
        #Streaming response
            async def response_stream():
                chat_coroutine = clients["azure_openai"].chat.completions.create(
                    model=model,
                    messages=message,
                    stream=True,
                )
                async for event in await chat_coroutine:
                    if event.choices:
                        yield json.dumps(event.choices[0].delta.content, ensure_ascii=False)
            return StreamingResponse(response_stream(), media_type="text/event-stream")
    else:
        #Non-Streaming Response
        response = await clients["azure_openai"].chat.completions.create(
            model=model,
            messages=message,
            stream=False,
        )
        return response.choices[0].message.content