FROM node:16-alpine
COPY . .
RUN apk add --no-cache build-base tzdata python3 sqlite-dev sqlite git
RUN git config --global url."https://".insteadOf ssh:// && chmod +x build.sh
RUN npm config set ssl-strict=false
ENV NODE_ENV ${NODE_ENV}
RUN rm -rf package-lock.json
RUN npm i -g npm@8.12.2
RUN npm cache verify && npm cache clean --force
RUN npm install swagger-themes pm2-runtime && npm i
#RUN npm install paytabs_pt2 
RUN npm run build 
EXPOSE 3000
