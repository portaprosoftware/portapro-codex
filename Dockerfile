# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy app source code
COPY . .

# Expose port (change if your app uses a different port)
EXPOSE 8080

# Start the app
CMD ["npm", "start"]