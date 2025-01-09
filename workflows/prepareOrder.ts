import { proxyActivities } from '@temporalio/workflow';
import type * as prepareOrderActivities from '../activities/prepareOrder';

const { prepareOrder, pushRequestsToQueue } = proxyActivities<typeof prepareOrderActivities>({
    startToCloseTimeout: '1 minute',
});
export async function prepareOrderWorkflow(data: any): Promise<any> {
    const requests = await prepareOrder(data)
    await pushRequestsToQueue(requests)
    return data.order
}
