import logging
import sys

formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s")
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(stream_handler)

logger_uvicorn = logging.getLogger("uvicorn")
logger_uvicorn.setLevel(logging.INFO)
logger_uvicorn.addHandler(stream_handler)
logger_uvicorn.propagate = False

logger_uvicorn_error = logging.getLogger("uvicorn.error")
logger_uvicorn_error.setLevel(logging.INFO)
logger_uvicorn_error.addHandler(stream_handler)
logger_uvicorn_error.propagate = False

logger_uvicorn_access = logging.getLogger("uvicorn.access")
logger_uvicorn_access.setLevel(logging.INFO)
logger_uvicorn_access.addHandler(stream_handler)
logger_uvicorn_access.propagate = False
