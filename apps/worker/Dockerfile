FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /workspace

COPY . .

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @tokenfc/db build
RUN pnpm --filter @tokenfc/worker build

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@tokenfc/worker", "start"]
