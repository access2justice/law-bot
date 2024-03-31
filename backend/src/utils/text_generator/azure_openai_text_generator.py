from openai import AsyncAzureOpenAI

from .text_generator_base import TextGeneratorBase


class AzureOpenAITextGenerator(TextGeneratorBase):
    def __new__(cls, azure_endpoint: str, api_key: str, model, temperature: float, max_response_tokens: int, *args, **kwargs):
        instance = super(AzureOpenAITextGenerator, cls).__new__(cls, *args, **kwargs)
        return instance

    def __init__(self, azure_endpoint: str, api_key: str, model, temperature: float, max_response_tokens: int):
        self._client = AsyncAzureOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=api_key,
            api_version="2023-09-01-preview"
        )

        self._model = model
        self._temperature = temperature
        self._max_response_tokens = max_response_tokens

    def stream_generator(self, conversation):
        return self._client.chat.completions.create(
            model=self._model,
            temperature=self._temperature,
            messages=conversation,
            max_tokens=self._max_response_tokens,
            stream=True
        )

    async def generate_message(self, conversation):
        gpt_message = await self._client.chat.completions.create(
            model=self._model,
            temperature=self._temperature,
            messages=conversation,
            max_tokens=self._max_response_tokens,
            stream=False
        )
        return gpt_message.choices[0].message.content
