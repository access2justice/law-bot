from . import create_app
from mangum import Mangum

app = create_app()


@app.get("/")
def get_root():
    return {"message": "FastAPI running in a Lambda function"}


lambda_handler = Mangum(app)
