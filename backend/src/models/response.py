from typing import Any, Dict, Union
from pydantic import BaseModel

class ChatResponse(BaseModel):
    data: Union[str, Dict[str, Any]]