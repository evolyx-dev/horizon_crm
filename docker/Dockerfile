FROM python:3.11-slim-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    build-essential \
    libffi-dev \
    libssl-dev \
    libmysqlclient-dev \
    pkg-config \
    mariadb-client \
    redis-tools \
    sudo \
    xvfb \
    libfontconfig \
    wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Yarn
RUN npm install -g yarn

# Create frappe user
RUN useradd -m -s /bin/bash frappe \
    && echo "frappe ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Install bench
RUN pip install frappe-bench

USER frappe
WORKDIR /workspace

# Initialize bench (will be done in init.sh for first time)
RUN mkdir -p /workspace/frappe-bench

EXPOSE 8000 9000
