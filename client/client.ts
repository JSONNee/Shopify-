import { Client } from '@temporalio/client';
import _ from 'lodash';
// import express from 'express';
// import https from 'https';
// import fs from 'fs';
// import path from 'path';
// import { prepareOrderWorkflow } from './workflows/prepareOrder';
import { processRequestQueuesWorkflow } from './workflows/processRequestQueues';
import { fetchOrdersWorkflow } from './workflows/fetchOrder';
// const app = express();
// app.use(express.json());
const client = new Client();

// async function getLatestPayload(workflowId: string) {
//   try {
//     const workflowHandle = client.workflow.getHandle(workflowId);
//     const history = await workflowHandle.fetchHistory();
//     const completedEvent = history?.events?.reverse().find((event) => event.eventType === 2);
//     const payload = completedEvent?.workflowExecutionCompletedEventAttributes?.result?.payloads?.[0];
//     const result = payload?.data ? JSON.parse(Buffer.from(payload.data).toString('utf-8')) : null;
//     return result;
//   } catch (error) {
//     return null
//   }
// }

// async function executePrepareOrderWorkflow(data: any, workflowId: string) {
//   try {
//     const workflow = await client.workflow.execute(prepareOrderWorkflow, {
//       taskQueue: 'prepare-order-task',
//       workflowId,
//       args: [data],
//     });
//     return workflow;
//   } catch (error) {
//     return null
//   }
// }

async function executeOrderQueueWorkflow() {
  return await client.workflow.execute(processRequestQueuesWorkflow, {
    taskQueue: 'process-request-queue-task',
    workflowId: 'process-request-queue',
  });
}

async function executeFetchOrdersWorkflow() {
  const timestamp = process.argv[2];
  console.log(timestamp)
  return await client.workflow.execute(fetchOrdersWorkflow, {
    taskQueue: 'fetch-orders-task',
    workflowId: 'fetch-orders-queue',
    args: [timestamp],
  });
}

// async function prepareSingleOrder(order: any) {
//   const workflowId = `order-${order.name}`
//   const latestPayload = await getLatestPayload(workflowId)
//   if (!latestPayload || !_.isEqual(latestPayload, order)) {
//     const newOrderPayload = await executePrepareOrderWorkflow({ order, latestPayload }, workflowId)
//     return newOrderPayload
//   }
//   return null
// }

// function createListener() {
//   app.post('/webhook', async (req: any, res: any) => {
//     const order = req.body
//     try {
//       const prepareSingleOrderResult = await prepareSingleOrder(order)
//       res.status(200).send(prepareSingleOrderResult ? `Order ${order.name} is being processed` : `Order ${order.name} was rejected because of duplication`);
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   });
//   app.post('/history', async (req: any, res: any) => {
//     const body = req.body
//     try {
//       const workflowHandle = client.workflow.getHandle(body.id);
//       const history = await workflowHandle.fetchHistory();
//       res.status(200).send(history);
//     } catch (error) {
//       res.status(500).send(error);
//     }
//   });

//   const PORT = 8091;
//   const options = {
//     key: fs.readFileSync(path.join(__dirname, "assets/localhost-key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "assets/localhost.pem")),
//   };
//   const server = https.createServer(options, app);
//   server.listen(PORT, () => {
//     console.log(`Server is running on https://localhost:${PORT}/webhook`);
//   });
// }

async function run() {
  // createListener()
  await Promise.all([
    executeFetchOrdersWorkflow(),
    executeOrderQueueWorkflow()
  ])
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
client
