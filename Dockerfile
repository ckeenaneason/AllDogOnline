FROM node:26-slim

# git for VS Code's Source Control when attached via Dev Containers.
# RUN apt-get update \
#   && apt-get install -y --no-install-recommends git ca-certificates \
#   && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies in their own layer so source edits don't trigger a reinstall.
# The compose file mounts node_modules as a named volume, which Docker pulls from this layer.
COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/extension/package.json apps/extension/
COPY apps/backend-shell/package.json apps/backend-shell/
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]