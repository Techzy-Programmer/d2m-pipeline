import * as core from '@actions/core'
import * as github from '@actions/github'

async function run() {
  try {
    const message = core.getInput('message')
    console.log(`The message is: ${message}`)
    
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
