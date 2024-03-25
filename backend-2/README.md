# law-bot backend-2

## Development
In production this backend runs as a aws lambda function. For development purposes there is an `index-bun.ts` file which adapts to the original `index.ts` file.

You still need to get a bunch of environment variables (see [.env.example](.env.example)) from the maintainer of the project.

### Setup
- Install bun.js by Follow the instructions on https://bun.sh
- Install the dependencies: `bun install`
- Get the required environment variables from the maintainer of the project and save them in `backend-2/.env`.

### Run
Run the backend:
```bash
bun --watch run index-bun.ts
```

Make a request to the backend:
```bash
curl --request POST \
  --url http://localhost:8080/ \
  --data '{
  "message": [
    {
      "role": "user",
      "content": "How long is the maternity leave?"
    }
  ],
  "stream": false
}'
```