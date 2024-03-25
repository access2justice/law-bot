import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .services.globals import clients
from .api import chat


def create_app():
    load_dotenv(override=True)
    is_dev = os.getenv('RUNNING_ENV') == 'dev'
    app = FastAPI(root_path="/prod",
                  docs_url="/docs",
                  redoc_url="/redoc",
                  openapi_url="/openapi.json")

    # include routers
    app.include_router(chat.router)

    if is_dev:
        origins = ["http://localhost"]
        origins.append(os.getenv('ALLOWED_ORIGINS'))
        # Generate Swagger schema
        import json
        openapi_schema = app.openapi()
        openapi_schema_json = json.dumps(openapi_schema, indent=2)
        with open('openapi_schema.json', 'w') as file:
            file.write(openapi_schema_json)
    else:
        origins = ["https://frontend-socram-testing.vercel.app/"]
        origins.append(os.getenv('ALLOWED_ORIGINS'))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app
