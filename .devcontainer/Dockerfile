FROM oven/bun:latest

# Install system dependencies
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    nano \
    unzip \
    vim-tiny \
    clang \
    libsecp256k1-dev \
    protobuf-compiler \
    build-essential \
    && apt-get auto-remove -y \
    && apt-get clean -y \
    && chsh -s $(which bash) bun \
    && echo 'export PS1="\e[01;32m\u\e[m:\e[01;34m\w\e[m\$ "' >> /home/bun/.bashrc

USER bun
WORKDIR /home/bun
