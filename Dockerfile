FROM node:21.7.3

# Set the working directory
ENV APP_DIR=/apps/prepsom-games-backend
WORKDIR ${APP_DIR}

# Copy only necessary files (make sure you have a .dockerignore to avoid unnecessary files like node_modules)
COPY . .

# Install dependencies using npm ci for a clean install if package-lock.json exists
RUN npm ci

# Build the project using TypeScript compiler (npx tsc)
RUN npx tsc

# Expose the port Cloud Run will listen on
EXPOSE 8080

# Start the Node.js app
CMD ["node", "dist/index.js"]
