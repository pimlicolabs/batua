# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install system dependencies including bash for Bun installation and git
RUN apk add --no-cache libc6-compat curl unzip bash git

# Create a non-root user
RUN addgroup -g 1001 -S ubuntu && adduser -S ubuntu -u 1001 -G ubuntu

# Install Bun globally
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Switch to non-root user and set working directory to home
USER ubuntu
WORKDIR /home/ubuntu

# Install Bun for the user
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/ubuntu/.bun/bin:$PATH"

# Set environment for development
ENV NODE_ENV=development

# Default shell
CMD ["/bin/bash"] 