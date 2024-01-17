FROM amazon/aws-lambda-python:3.9
# Copies and install requirements.txt file into the container
COPY src/requirements.txt ./

RUN pip install -r requirements.txt -t .

# Goes last to take advantage of Docker caching.
COPY src/ .

# Points to the handler function of your lambda function 
CMD ["app.lambda_handler"]