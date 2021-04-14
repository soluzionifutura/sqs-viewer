import express, { Request, Response, NextFunction } from "express"
import Debug from "debug"
import SqsComponent from "./components/SqsComponent"
import { join } from "path"
const app = express()

const debug = Debug("sqs-viewer")
const { PORT = 8888, NODE_ENV = "local", SQS_REGION, SQS_LOCAL_ENDPOINT } = process.env

void (async(): Promise<void> => {
  const sqsComponent = new SqsComponent({
    env: NODE_ENV!,
    region: SQS_REGION!,
    localEndpoint: SQS_LOCAL_ENDPOINT!
  })

  app.use(express.static(join(__dirname, "public")))

  app.get("/listQueues", async(req, res) => {
    const data = await sqsComponent.sqs.listQueues().promise()
    res.json(data.QueueUrls!.map(e => {
      if (new URL(e).hostname === "localhost") {
        return e.replace("localhost", new URL(SQS_LOCAL_ENDPOINT!).hostname)
      }
      return e
    }))
  })

  app.get("/getQueueAttributes", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueUrl query param"
      })
    }

    const attributes = (await sqsComponent.sqs.getQueueAttributes({
      QueueUrl: queueUrl,
      AttributeNames: (req.query.fields as string).split(",") || ["All"]
    }).promise()).Attributes

    res.json({
      queueUrl,
      attributes
    })
  })

  app.get("/purgeQueue", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueArn query param"
      })
    }

    res.json((await sqsComponent.sqs.purgeQueue({
      QueueUrl: queueUrl
    }).promise()))
  })

  app.get("/receiveMessages", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueArn query param"
      })
    }

    res.json((await sqsComponent.sqs.receiveMessage({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      VisibilityTimeout: 0
    }).promise()).Messages  || [])
  })

  app.all("*", (req, res) => res.sendStatus(404))

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, req: Request, res: Response, _: NextFunction) => {
    res.status(500).json({
      error: err.stack
    })
  })

  app.listen(PORT, () => debug("Sqs viewer listening on port %O", PORT))
})()
  // eslint-disable-next-line no-console
  .catch(console.error)
