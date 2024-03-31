from typing import List

import tiktoken


def num_tokens_from_messages(messages: list, model: str = "gpt-4") -> int:
    """Returns the number of tokens in a message list."""
    encoding = tiktoken.encoding_for_model(model)
    num_tokens = 0
    for message in messages:
        num_tokens += 4  # every message follows <im_start>{role/name}\n{content}<im_end>\n
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":  # if there's a name, the role is omitted
                num_tokens += -1  # role is always required and always 1 token
    num_tokens += 2  # every reply is primed with <im_start>assistant
    return num_tokens


def get_sys_prompt(sys_content: str):
    sys_message = [{"role": "system", "content": sys_content}]
    return sys_message


def get_user_prompt(text: List[str]) -> str:
    prompt = f"""
    Swiss law:
    {text}
    """
    return prompt

