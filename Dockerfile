FROM mongo:6.0.13-jammy
WORKDIR /app
COPY . .
RUN apt-get update && apt-get -qq -y install curl
RUN curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash 
RUN nvm install 12.17.0
RUN npm update && chmod +x ./build.sh
EXPOSE 3000 27017
#CMD ["./build.sh"]
