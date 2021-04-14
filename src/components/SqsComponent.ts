import AWS from "aws-sdk"

export default class SqsComponent {
  #env: string
  readonly localEndpoint: string
  readonly sqs: AWS.SQS

  constructor(options: {
    region: string,
    localEndpoint: string,
    env?: string
  }) {
    this.#env = options.env || process.env.NODE_ENV || "local"
    this.localEndpoint = options.localEndpoint

    const config: AWS.SQS.ClientConfiguration = {
      region: options.region
    }

    if (this.#env === "local") {
      config.credentials = { accessKeyId: "X", secretAccessKey: "Y" }
      config.endpoint = this.localEndpoint
    }

    this.sqs = new AWS.SQS(config)
  }
}
