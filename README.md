# sqs-viewer

## Setup

```bash
  npm i
```

include it in a docker-compose file link this:

```yml
  sqs:
    image: softwaremill/elasticmq
    container_name: sqs
    ports:
      - 9324:9324
    volumes:
      - ./sqs/config/custom.conf:/opt/elasticmq.conf:cached
    logging:
      driver: none

  sqs-viewer:
    build:
      context: $PWD/sqs-viewer
      dockerfile: Dockerfile
      args:
        NODE_ENV: local
        AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
        AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
        AWS_SESSION_TOKEN: ${AWS_SESSION_TOKEN}
    container_name: sqs-viewer
    entrypoint: "npm run dev"
    volumes:
      - $PWD/sqs-viewer:/home/node/app
    environment:
      NODE_ENV: local
      DEBUG: ${DEBUG}
      DEBUG_HIDE_DATE: 1
      DEBUG_COLORS: 1
      FORCE_COLORS: 1
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_SESSION_TOKEN: ${AWS_SESSION_TOKEN}
      PORT: ${SQS_VIEWER_PORT}
      SQS_REGION: ${SQS_REGION}
      SQS_LOCAL_ENDPOINT: ${SQS_LOCAL_ENDPOINT}
    ports:
      - ${SQS_VIEWER_PORT}:${SQS_VIEWER_PORT}
    depends_on:
      - sqs
```
