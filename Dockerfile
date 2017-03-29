FROM node:4

# Add everything in the current directory to our image
ADD . /app

# Expose our server port for now
EXPOSE 80

# Run our app.
WORKDIR "/app"
CMD ["node", "server.js"]