from typing import Any
import abc
import inspect


class TextGeneratorBase(abc.ABC):

    def __new__(cls, *args, **kwargs):
        # get all coros of EmbeddingGeneratorBase
        parent_coros = inspect.getmembers(TextGeneratorBase, predicate=inspect.iscoroutinefunction)

        # check if parent's coros are still coros in a child
        for coro in parent_coros:
            child_method = getattr(cls, coro[0])
            if not inspect.iscoroutinefunction(child_method):
                raise RuntimeError('The method %s must be a coroutine' % (child_method,))

        return super(TextGeneratorBase, cls).__new__(cls, *args, **kwargs)

    @abc.abstractmethod
    def stream_generator(self, conversation) -> Any:
        pass

    @abc.abstractmethod
    async def generate_message(self, conversation) -> Any:
        pass
