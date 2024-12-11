import { panic } from './utils/general';
import { getInputs } from './utils/get-inputs';
import { APIClient } from './utils/api-client';

async function run() {
  try {
    const [workflowInput, coreInput] = getInputs();
    const { key, host, port } = coreInput;
    
    APIClient.setConfig(key, `http://${host}:${port}/api`);
    await testConnection();

    console.log("Received inputs:", workflowInput, { key });
  } catch (error) {
    if (error instanceof Error) panic(error.message);
  }
}

run()

async function testConnection() {
  try {
    const response = await new APIClient()
      .sendEncrypted("/health", {});
    const data = await response.json();

    if (!response.ok || data.message !== "d2m server is healthy") {
      panic("Invalid connection to d2m server");
    }

    console.log("Connection to d2m server is healthy");
    console.log("D2M server version:", data.version);
  } catch (error) {
    console.log(error);
    panic("Looks like d2m is not running on your prod machine");
  }
}
