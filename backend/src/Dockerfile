FROM amazon/aws-lambda-python:3.9.2024.01.05.15

# Copies requirements.txt file into the container
COPY requirements.txt ./
# Installs dependencies found in your requirements.txt file
RUN pip install -r requirements.txt -t .

# Goes last to take advantage of Docker caching.
COPY . .

# Points to the handler function of your lambda function 
CMD ["app.lambda_handler"]