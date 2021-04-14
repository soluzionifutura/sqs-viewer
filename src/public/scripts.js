/* eslint-disable no-console */
void(async() => {
  const container = document.getElementById("container")

  setInterval(async() => {
    const data = await(await fetch("./listQueues")).json()
    const queues = await Promise.all(data.map(e => fetch(`./getQueueAttributes?queueUrl=${e}&fields=QueueArn,ApproximateNumberOfMessages,ApproximateNumberOfMessagesNotVisible,ApproximateNumberOfMessagesDelayed`).then(res => res.json())))

    queues.forEach(updateQueueElement)
  }, 1000)

  const createQueueElement = (queue) => {
    const queueElement = document.createElement("div")
    queueElement.innerHTML = `
      <div class="queue-block">
        <h2>${queue.attributes.QueueArn}</h2>
        <ul>
          ${Object.entries(queue.attributes).filter(([key]) => !["QueueArn"].includes(key)).map(([key, value]) => `
            <li>
              <b>${key}:</b> <span class=${key}>${value}</span>
            </li>
        `).join("")}
        </ul>
        <input type="button" class="purge-button" value="Purge"/>
        <input type="button" class="receive-button" value="Receive messages"/>
        <input type="button" class="clear-button" value="Clear messages"/>
        <div class="messages-block"></div>
      </div>
    `
    queueElement.getElementsByClassName("purge-button")[0].addEventListener("click", async() => {
      await fetch(`./purgeQueue?queueUrl=${queue.queueUrl}`)
    })
    const messagesBlockElement = queueElement.getElementsByClassName("messages-block")[0]
    let messages = {}

    queueElement.getElementsByClassName("receive-button")[0].addEventListener("click", async() => {
      (await (await fetch(`./receiveMessages?queueUrl=${queue.queueUrl}`)).json()).forEach(e => {
        if (!messages[e.MessageId]) {
          messages[e.MessageId] = e
        }
      })
      renderMessages()
    })

    queueElement.getElementsByClassName("clear-button")[0].addEventListener("click", async() => {
      messages = {}
      renderMessages()
    })

    container.appendChild(queueElement)

    const renderMessages = () => {
      messagesBlockElement.innerHTML = `
        <ul>
          ${Object.values(messages).map(e => `
          <li>
            <h3>${e.MessageId}</h3>
            <ul>
              ${Object.entries(e).filter(([key]) => !["MessageId"].includes(key)).map(([key, value]) => `
                <li>
                  <b>${key}:</b> <span class=${key}>${value}</span>
                </li>
              `).join("")}
            </ul>
          <li>
        `).join("")}
        </ul>
      `
    }

    return queueElement
  }

  const queueElements = {}
  const getQueueElement = (queue) => {
    if (!queueElements[queue.attributes.QueueArn]) {
      queueElements[queue.attributes.QueueArn] = createQueueElement(queue)
    }
    return queueElements[queue.attributes.QueueArn]
  }

  const updateQueueElement = (queue) => {
    const queueElement = getQueueElement(queue)
    Object.entries(queue.attributes).forEach(([key, value]) => {
      const e = queueElement.getElementsByClassName(key)[0]
      if (e && e.innerHTML !== value) {
        e.innerHTML = value
      }
    })
  }
})()
  .catch(console.error())
