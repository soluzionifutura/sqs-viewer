/* eslint-disable no-console */
import express, { Request, Response, NextFunction } from "express"
import Debug from "debug"
import SqsComponent from "@soluzioni-futura/sqs-component"
import { join } from "path"
const app = express()

const debug = Debug("sqs-viewer")
const { PORT = 8888, NODE_ENV, SQS_REGION, SQS_LOCAL_ENDPOINT } = process.env

void (async(): Promise<void> => {
  const sqsComponent = new SqsComponent({
    env: NODE_ENV!,
    region: SQS_REGION!,
    localEndpoint: SQS_LOCAL_ENDPOINT!
  })

  app.use(express.static(join(__dirname, "public")))

  app.get("/listQueues", async(req, res) => {
    try {
      const data = await sqsComponent.sqs.listQueues().promise()

      res.json((data.QueueUrls || []).map(e => {
        if (new URL(e).hostname === "localhost") {
          return e.replace("localhost", new URL(SQS_LOCAL_ENDPOINT!).hostname)
        }
        return e
      }))
    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: err.stack
      })
    }
  })

  app.get("/getQueueAttributes", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueUrl query param"
      })
    }

    try {
      const attributes = (await sqsComponent.sqs.getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: (req.query.fields as string).split(",") || ["All"]
      }).promise()).Attributes

      res.json({
        queueUrl,
        attributes
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: err.stack
      })
    }
  })

  app.get("/purgeQueue", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueArn query param"
      })
    }

    try {
      res.json((await sqsComponent.sqs.purgeQueue({
        QueueUrl: queueUrl
      }).promise()))
    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: err.stack
      })
    }
  })

  app.get("/receiveMessages", async(req, res) => {
    const queueUrl: string = req.query.queueUrl as string
    if (!queueUrl) {
      return res.status(400).json({
        error: "missing queueArn query param"
      })
    }

    try {
      const { Messages } = await sqsComponent.sqs.receiveMessage({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 0
      }).promise()

      res.json(Messages || [])
    } catch (err) {
      console.error(err)
      res.status(500).json({
        error: err.stack
      })
    }
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
