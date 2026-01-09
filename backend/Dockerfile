FROM node:20-alpine

# Install dependencies for pdf2pic (GraphicsMagick and Ghostscript)
# and build tools for native modules like bcrypt
RUN apk add --no-cache \
    graphicsmagick \
    ghostscript \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:dev"]
