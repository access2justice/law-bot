from typing import Any
import abc
import inspect


class TextSearcherBase(abc.ABC):

    def __new__(cls, *args, **kwargs):
        # get all coros of TextSearcherBase
        parent_coros = inspect.getmembers(TextSearcherBase, predicate=inspect.iscoroutinefunction)

        # check if parent's coros are still coros in a child
        for coro in parent_coros:
            child_method = getattr(cls, coro[0])
            if not inspect.iscoroutinefunction(child_method):
                raise RuntimeError('The method %s must be a coroutine' % (child_method,))

        return super(TextSearcherBase, cls).__new__(cls, *args, **kwargs)

    @abc.abstractmethod
    async def search(self, user_query: str, n_top_results: int) -> Any:
        pass
