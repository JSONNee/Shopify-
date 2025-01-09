import { Client } from '@temporalio/client';
import axios from 'axios';
// import { orderResponseWorkflow } from '../workflows/orderResponse';
import { getLatestPayload } from './common';
import { addCreditMemoRequestSignal, addCustomerRefundRequestSignal } from '../workflows/processRequestQueues';

const host = 'localhost';
const port = '8081';
const url = `http://${host}:${port}`;
const client = new Client();

export async function sendRequests(requests: any[], requestType: string): Promise<any> {
    try {
        const newRequests = requests.map((request) => request.value)
        const responses = await axios.post(`${url}/${requestType}`, newRequests)
        for (const response of responses.data) {
            // const workflowId = `NS-${response.name}`
            // const latestPayload: any = await getLatestPayload(workflowId, client) || {}
            // latestPayload[requestType] = response.internalId
            // client.workflow.execute(orderResponseWorkflow, {
            //     args: [latestPayload],
            //     taskQueue: 'order-response-task',
            //     workflowId
            // })
            const handle = client.workflow.getHandle('process-request-queue')
            const request = requests.filter((request) => request.value.orderName === response.orderName)[0]
            if (requestType === 'invoice') {
                await handle.signal(addCreditMemoRequestSignal, {
                    key: `${request?.id}-creditMemo`,
                    internalId: response.internalId
                })
            } else if (requestType === 'creditMemo') {
                await handle.signal(addCustomerRefundRequestSignal, {
                    key: `${request?.id}-customerRefund`,
                    internalId: response.internalId
                })
            }
        }
        return responses.data;
    } catch (error: any) {
        throw new Error(error?.message);
    }
}
