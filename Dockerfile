FROM mongo:7.0.7-jammy
COPY . .
ENV NODE_ENV ${NODE_ENV}
RUN apt-get update && apt-get -qq -y install curl
RUN curl -fsSL  https://deb.nodesource.com/setup_18.x |bash
RUN apt-get install -qq -y nodejs
#RUN RUN node --optimize_for_size --max_old_space_size=490 
RUN npm install 
RUN npm install @nestjs/swagger@4.5.3 swagger-ui-express@4.1.4 --force
EXPOSE 3000 27017
CMD ["npm","run","start"]
