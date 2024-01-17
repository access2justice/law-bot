FROM amazon/aws-lambda-python:3.9
# Copies and install requirements.txt file into the container
COPY requirements.txt ./

RUN pip install -r requirements.txt -t .

# Goes last to take advantage of Docker caching.
COPY src/ src/

# Points to the handler function of your lambda function 
CMD ["src.app.lambda_handler"]