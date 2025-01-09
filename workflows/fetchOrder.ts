import { proxyActivities } from '@temporalio/workflow'
import { sleep } from '@temporalio/workflow'
import type * as activities from '../activities/fetchOrder';

const { getOrdersByGraphQLStep1,
  getOrdersByGraphQLStep3, ndJSONtoJSON,
  groupPayloadByOrder, prepareSingleOrder } = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
  })
const { getOrdersByGraphQLStep2 } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
  retry: {
    initialInterval: '5 seconds',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
  },
})

export async function fetchOrdersWorkflow(updatedAt: string): Promise<any> {
  let pollingTime = updatedAt
  const sleepTime = 30 * 1000

  while (true) {
    const step1Result: any = await getOrdersByGraphQLStep1(pollingTime)
    const step2Result: any = await getOrdersByGraphQLStep2(step1Result?.data?.bulkOperationRunQuery?.bulkOperation?.id)

    const url = step2Result?.data?.node?.url || null
    if (url == null) {
      console.log("URL is null. No orders have been update.")
      await sleep(sleepTime)
      continue
    }
    const step3Result: any = await getOrdersByGraphQLStep3(url)
    const originalResponse = await ndJSONtoJSON(step3Result)
    const transformedOrders = await groupPayloadByOrder(originalResponse)
    console.log(`Fetched ${transformedOrders.length} new orders.`)
    const lastUpdatedAt = transformedOrders[transformedOrders.length - 1][0].updatedAt
    const updateTime = new Date(lastUpdatedAt)
    updateTime.setSeconds(updateTime.getSeconds() + 1)
    pollingTime = updateTime.toISOString()
    transformedOrders.forEach(async (order: any) => {
      await prepareSingleOrder(order)
    });
    await sleep(sleepTime)
  }
}
