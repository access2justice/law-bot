# Run the backend locally using Docker
1. Install and start Docker. [Download Docker](https://docs.docker.com/get-docker/)

2. Create a .env file under `\backend` folder with required environment variables.  

3. Open the backend project (the `\backend` folder) in your IDE and open a terminal window within the IDE. 

4. Run the following commands:  

    - Build the Docker image:  
        `docker build -f Dockerfile.dev -t lawbot:dev .`  
    - Run the container:  
        For **Mac** users, `docker run -p 8000:80 -v $(pwd):/backend lawbot:dev`  
        For **Windows** users, `docker run -p 8000:80 -v "%cd%":/backend lawbot:dev`  

Once the container is up and running, access the backend via `http://127.0.0.1:8000/`
