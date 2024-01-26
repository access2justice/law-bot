from . import create_app
from mangum import Mangum

app = create_app()

# Generate Swagger schema
# import json
# openapi_schema = app.openapi()
# openapi_schema_json = json.dumps(openapi_schema, indent=2)
# with open('openapi_schema.json', 'w') as file:
#     file.write(openapi_schema_json)

lambda_handler = Mangum(app)