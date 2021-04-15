#!/usr/bin/env node
/* eslint-disable no-console */
import parser from "yargs-parser"
const { build, _: [action, ...argServices] } = parser(process.argv.slice(2))

import YAML from "yaml"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { exec } from "child_process"
import AWS from "aws-sdk"

if (build) {
  console.log("FORCING BUILD AND RECREATE")
}

void (async(): Promise<void> => {
  const sts = new AWS.STS()
  let credentials: AWS.STS.Credentials
  try {
    credentials = (await sts.getSessionToken().promise()).Credentials!
  } catch (err) {
    if (err.statusCode === 403) {
      const { Arn } = await sts.getCallerIdentity().promise()
      credentials = (await sts.assumeRole({
        RoleArn: Arn!.replace(":assumed-role", ":role").split("/").slice(0, -1).join("/"),
        RoleSessionName: new Date().getTime().toString()
      }).promise()).Credentials!
    } else {
      throw err
    }
  }

  const cwd = process.cwd()
  const dockerCompose = YAML.parse(readFileSync(join(cwd, "docker-compose.yml"), "utf8"))
  const activeServices: string[] = []

  if (action) {
    if (["only", "without"].includes(action)) {
      Object.keys(dockerCompose.services).forEach(serviceName => {
        if ((action === "only" && argServices.includes(serviceName)) || (action === "without" && !argServices.includes(serviceName))) {
          activeServices.push(serviceName)
        }
      })
    } else {
      throw new Error("invalid action: allowed actions: \"only\", \"without\" (npm start with/without ...microservice-names)")
    }
  }

  const command = `
      docker-compose down -v --remove-orphans && \\
      AWS_ACCESS_KEY_ID=${credentials.AccessKeyId} \\
      AWS_SECRET_ACCESS_KEY=${credentials.SecretAccessKey} \\
      AWS_SESSION_TOKEN=${credentials.SessionToken} \\
      PROJECT_FOLDER=$PWD \\
      MICROSERVICES_PATH=microservices \\
      docker-compose \\
      ${existsSync(join(cwd, "docker-volumes.yml")) ? "-f docker-volumes.yml" : ""} \\
      -f docker-compose.yml \\
      up ${ build ? "--build --force-recreate" : "" } ${activeServices.length ? activeServices.join(" ") : ""}
  `

  const dockerProcess = exec(command)

  dockerProcess.stdout!.on("data", data => {
    console.log(data)
  })

  dockerProcess.stderr!.on("data", err => {
    console.error(err)
  })
})()
  .catch(console.error)
