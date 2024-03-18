FROM mongo:6.0.13-jammy
COPY . .
RUN apt-get update && apt-get -qq -y install curl
RUN curl -fsSL  https://deb.nodesource.com/setup_18.x |bash
RUN apt-get install -qq -y nodejs
RUN npm update && chmod +x ./build.sh
EXPOSE 3000 27017
#CMD ["./build.sh"]
