FROM node:18-alpine
COPY . .
RUN apk add --no-cache build-base tzdata python3 sqlite-dev sqlite git
RUN git config --global url."https://".insteadOf ssh:// && chmod +x build.sh
#RUN npm config set ssl-strict=false
ENV NODE_ENV ${NODE_ENV}
RUN rm -rf package-lock.json
RUN npm i -g npx pm2
RUN npm cache verify && npm cache clean --force
RUN npm install swagger-themes class-validator-mongo-object-id @swc/cli @swc/core --save
#RUN npm install paytabs_pt2 
RUN npx nest build
EXPOSE 3000
