import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as processRequestsActivities from '../activities/processRequests';
export const addInvoiceRequestSignal = defineSignal<[any]>('addInvoiceRequest');
export const addCreditMemoRequestSignal = defineSignal<[any]>('addCreditMemoRequest');
export const addCustomerRefundRequestSignal = defineSignal<[any]>('addCustomerRefundRequest');
export const addWaitingRequestSignal = defineSignal<[any]>('addWaitingRequest');

const { processRequests } = proxyActivities<typeof processRequestsActivities>({
    startToCloseTimeout: '1 minute',
});

export async function processRequestQueuesWorkflow() {
    let invoiceRequestQueue: any[] = [];
    let creditMemoRequestQueue: any[] = [];
    let customerRefundRequestQueue: any[] = [];
    let waitingRequestQueue: any = {}

    const addInvoiceRequest = (params: any) => {
        const request = waitingRequestQueue[params.key]
        if (request) {
            request.value.internalId = params.internalId
            invoiceRequestQueue.push(request)
            delete waitingRequestQueue[params.key]
        }
    };
    const addCreditMemoRequest = (params: any) => {
        const request = waitingRequestQueue[params.key]
        if (request) {
            request.value.internalId = params.internalId
            creditMemoRequestQueue.push(request)
            delete waitingRequestQueue[params.key]
        }
    };
    const addCustomerRefundRequest = (params: any) => {
        const request = waitingRequestQueue[params.key]
        if (request) {
            request.value.internalId = params.internalId
            customerRefundRequestQueue.push(request)
            delete waitingRequestQueue[params.key]
        }
    };
    const addWaitingRequest = (request: any) => {
        waitingRequestQueue[request.key] = request.value;
    };

    setHandler(addInvoiceRequestSignal, addInvoiceRequest);
    setHandler(addCreditMemoRequestSignal, addCreditMemoRequest);
    setHandler(addCustomerRefundRequestSignal, addCustomerRefundRequest);
    setHandler(addWaitingRequestSignal, addWaitingRequest);

    while (true) {
        if (invoiceRequestQueue.length > 0) {
            const invoiceRequestsToProcess = [...invoiceRequestQueue]
            invoiceRequestQueue = []
            await processRequests(invoiceRequestsToProcess, 'invoice')
        }
        if (creditMemoRequestQueue.length > 0) {
            const creditMemoRequestsToProcess = [...creditMemoRequestQueue]
            creditMemoRequestQueue = []
            await processRequests(creditMemoRequestsToProcess, 'creditMemo')
        }
        if (customerRefundRequestQueue.length > 0) {
            const customerRefundRequestsToProcess = [...customerRefundRequestQueue]
            customerRefundRequestQueue = []
            await processRequests(customerRefundRequestsToProcess, 'customerRefund')
        }
        await sleep(5000);
    }
}
