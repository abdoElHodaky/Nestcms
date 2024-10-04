FROM node:18-alpine
COPY . .
RUN apk add --no-cache build-base tzdata python3 sqlite-dev sqlite git
#RUN git config --global url."https://".insteadOf ssh:// && chmod +x build.sh
#RUN npm config set ssl-strict=false
#ENV NODE_ENV ${NODE_ENV}
RUN npm i pm2 -g && rm -rf .git/hooks
#RUN npm cache verify && npm cache clean --force
RUN npm i && npm install swagger-themes class-validator-mongo-object-id @swc/cli @swc/core
#RUN npm install paytabs_pt2 
RUN npm run build && \
npm run start:prod
EXPOSE 3000
