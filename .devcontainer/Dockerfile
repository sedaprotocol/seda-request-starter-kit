FROM oven/bun:latest

# Install system dependencies
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    git \
    nano \
    unzip \
    vim-tiny \
    ssh \
    clang \
    libsecp256k1-dev \
    protobuf-compiler \
    nodejs \
    npm \
    build-essential \
    curl \
    && apt-get auto-remove -y \
    && apt-get clean -y \
    && chsh -s $(which bash) bun \
    && echo 'export PS1="\e[01;32m\u\e[m:\e[01;34m\w\e[m\$ "' >> /home/bun/.bashrc

# Now switch to bun user and install Rust
USER bun
WORKDIR /home/bun

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && . $HOME/.cargo/env \
    && rustup target add wasm32-wasip1 \
    && rustup target add wasm32-unknown-unknown \
    && rustup install nightly \
    && rustup component add rustfmt --toolchain nightly

# Add cargo environment to .bashrc for persistent access
RUN echo 'source $HOME/.cargo/env' >> ~/.bashrc
