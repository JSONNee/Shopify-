import { Client } from '@temporalio/client';
import { createWorker } from "../workers/worker"
import { sendRequestsWorkFlow } from '../workflows/sendRequests';
import { nanoid } from 'nanoid';

const client = new Client();

export const processRequests = async (requests: any[], requestType: string) => {
    const targetSystemMaxConcurrency: number = 4
    const maxNumOfWorkers: number = 10
    const requestBatches = splitArrayIntoBatches(requests, 2)
    const numOfWorkers = Math.min(...[targetSystemMaxConcurrency, maxNumOfWorkers, requestBatches.length])
    const maxConcurrentActivityExecutionsPerWorker = Math.floor(targetSystemMaxConcurrency / numOfWorkers)
    let requestBatchTaskQueue = `send-${requestType}-requests-task`

    const workerPromises: any[] = []
    for (let index = 0; index < numOfWorkers; index++) {
        const worker = await createWorker(requestBatchTaskQueue, 'sendRequests', maxConcurrentActivityExecutionsPerWorker)
        worker.run().catch((err) => console.error(err));
        workerPromises.push(worker)
    }
    Promise.all(workerPromises).then((workers) => {
        const requestBatchResponses = requestBatches.map(async (requestBatch) => {
            return await client.workflow.execute(sendRequestsWorkFlow, {
                args: [requestBatch, requestType],
                taskQueue: requestBatchTaskQueue,
                workflowId: `${requestBatchTaskQueue}-${nanoid()}`,
            })
        });

        Promise.all(requestBatchResponses).then(() => workers.map((worker) => worker.shutdown()))
    })
}

function splitArrayIntoBatches(array: any[], batchSize: number): any[] {
    const result: any[] = [];
    for (let i = 0; i < array.length; i += batchSize) {
        result.push(array.slice(i, i + batchSize));
    }
    return result;
}
