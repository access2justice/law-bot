# Run the backend locally using Docker
First, ensure Docker is installed. [Download Docker](https://docs.docker.com/get-docker/)  

Second, open the backend project (the `\backend` folder) in your IDE and open a terminal window within the IDE. 

Third, run the following commands:  

1. Build the Docker image:  
`docker build -f Dockerfile.dev -t lawbot:dev .`  
2. Run the container:  
For **Mac** users, `docker run -p 8000:80 -v $(pwd):/backend lawbot:dev`  
For **Windows** users, `docker run -p 8000:80 -v "%cd%":/backend lawbot:dev`  

Once the container is up and running, access the backend via `http://127.0.0.1:8000/`
