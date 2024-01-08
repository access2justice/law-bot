FROM amazon/aws-lambda-nodejs:18

ADD package*.json /tmp/
RUN cd /tmp && npm i --verbose
RUN mkdir -p /opt/app && cp -a /tmp/node_modules ./

ADD . ./
RUN npm run build
CMD [ "dist/lambda.handler" ]
