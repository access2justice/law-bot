from fastapi import FastAPI
from api import chat
from mangum import Mangum
import uvicorn

app = FastAPI()
app.include_router(chat.router)

@app.get("/")
def get_root():
    return {"message": "FastAPI running in a Lambda function"}

lambda_handler = Mangum(app)

#if __name__ == "__main__":
#   uvicorn.run("app:app", host="0.0.0.0", port="8000", reload=True)