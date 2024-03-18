from typing import List
import abc
import inspect


class EmbeddingsGeneratorBase(abc.ABC):

    def __new__(cls, *arg, **kwargs):
        # get all coros of EmbeddingGeneratorBase
        parent_coros = inspect.getmembers(EmbeddingsGeneratorBase, predicate=inspect.iscoroutinefunction)

        # check if parent's coros are still coros in a child
        for coro in parent_coros:
            child_method = getattr(cls, coro[0])
            if not inspect.iscoroutinefunction(child_method):
                raise RuntimeError('The method %s must be a coroutine' % (child_method,))

        return super(EmbeddingsGeneratorBase, cls).__new__(cls, *arg, **kwargs)

    @abc.abstractmethod
    async def generate(self, input: List[str]):
        pass
