from fastapi import APIRouter
from models.request import ChatRequest
import json
from fastapi import Response
from fastapi.encoders import jsonable_encoder
import logging

router = APIRouter()

@router.post("/chat")
async def chat_handler(chat_request: ChatRequest):
    prompt = [{"role":"system","content":"You are a Swiss legal assistant."}]
    message = prompt + jsonable_encoder(chat_request.message)
    response = json.dumps(message, indent=4)
    return Response(content=response, media_type='application/json')