import { Worker } from '@temporalio/worker';
import * as sendRequestsActivities from '../activities/sendRequests';
import * as processRequestsActivities from '../activities/processRequests';
import * as prepareOrderActivities from '../activities/prepareOrder';
import * as fetchOrderActivities from '../activities/fetchOrder';

const workflows: any = {
  processRequestQueues: require.resolve('../workflows/processRequestQueues'),
  sendRequests: require.resolve('../workflows/sendRequests'),
  prepareOrder: require.resolve('../workflows/prepareOrder'),
  fetchOrders: require.resolve('../workflows/fetchOrders'),
  orderResponse: require.resolve('../workflows/orderResponse'),
}
const activities: any = {
  processRequestQueues: processRequestsActivities,
  sendRequests: sendRequestsActivities,
  prepareOrder: prepareOrderActivities,
  fetchOrders: fetchOrderActivities,
}

export async function createWorker(taskQueue: string, type: string, maxConcurrentActivityTaskExecutions: number = 100) {
  const worker = await Worker.create({
    workflowsPath: workflows[type],
    activities: activities[type],
    taskQueue,
    maxConcurrentActivityTaskExecutions
  });
  return worker;
}

async function run() {
  (await createWorker('prepare-order-task', 'prepareOrder')).run().catch((err) => console.error(err));
  (await createWorker('process-request-queue-task', 'processRequestQueues')).run().catch((err) => console.error(err));
  (await createWorker('fetch-orders-task', 'fetchOrders')).run().catch((err) => console.error(err));
  (await createWorker('order-response-task', 'orderResponse')).run().catch((err) => console.error(err));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
