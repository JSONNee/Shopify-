import _ from 'lodash'
import { Client } from '@temporalio/client';
import { addInvoiceRequestSignal, addCreditMemoRequestSignal, addWaitingRequestSignal } from '../workflows/processRequestQueues';
import { nanoid } from 'nanoid';
// import { getLatestPayload } from '../activities/common';
const client = new Client();

function getAllSalesOfAgreement(currentPayload: any[], agreement: any) {
    return currentPayload?.filter(
        (line) =>
            line.__typename?.endsWith("Sale") && line.__parentId === agreement.id
    )
}

function groupAgreementsByAction(currentPayload: any[], newAgreements: any[], newTransactions: any[]) {
    const rawActionGroups: any[] = []
    const salesAgreements = newAgreements?.filter((line) => {
        const allSales = getAllSalesOfAgreement(currentPayload, line)
        const adjustmentSales = allSales.filter(
            (sale) =>
                sale.actionType === "RETURN" &&
                sale.quantity === null &&
                sale.__typename === "AdjustmentSale"
        )
        return allSales.length > adjustmentSales.length
    })

    salesAgreements.forEach((agreement, index) => {
        const allSales = getAllSalesOfAgreement(currentPayload, agreement)
        if (agreement.__typename === "RefundAgreement") {
            const actionGroup = [agreement]
            const negativeQuantitySales = allSales.filter(
                (sale) => sale.actionType === "RETURN" && sale.quantity < 0
            )
            if (negativeQuantitySales.length !== allSales.length) {
                if (
                    salesAgreements[index - 1]?.__typename === "ReturnAgreement" &&
                    salesAgreements[index - 1]?.app.handle === agreement.app.handle
                ) {
                    actionGroup.push(salesAgreements[index - 1])
                }
            }
            if (
                salesAgreements[index + 1]?.__typename === "OrderEditAgreement" &&
                salesAgreements[index + 1]?.app.handle === agreement.app.handle &&
                agreement.app.handle == "pos"
            ) {
                actionGroup.push(salesAgreements[index + 1])
            }
            const actionTime = Math.min(
                ...actionGroup.map((agreement) =>
                    new Date(agreement.happenedAt).getTime()
                )
            )
            rawActionGroups.push({
                time: actionTime,
                agreements: actionGroup,
            })
        }
    })

    const flattenActions = rawActionGroups.map((group) => group.agreements).flat()

    salesAgreements.forEach((agreement) => {
        if (!flattenActions.filter((action) => action.id === agreement.id)[0]) {
            rawActionGroups.push({
                time: new Date(agreement.happenedAt).getTime(),
                agreements: [agreement],
            })
        }
    })

    const sortedActionGroups = rawActionGroups.sort((a, b) => a.time - b.time)
    const actionGroups = sortedActionGroups.map((group, index) => {
        const transactions = newTransactions.filter((transaction: any) => {
            const transactionCreatedAt = new Date(transaction.createdAt).getTime()
            return (
                transactionCreatedAt >= group.time &&
                (!sortedActionGroups[index + 1] ||
                    transactionCreatedAt < sortedActionGroups[index + 1]?.time)
            )
        })
        group.transactions = transactions
        return group
    })

    return actionGroups
}

export async function prepareOrder(data: any): Promise<any> {
    const latestAgreements = data.latestPayload?.filter((line: any) => line.__typename.endsWith('Agreement'))
    const currentAgreements = data.order?.filter((line: any) => line.__typename.endsWith('Agreement'))
    const newAgreements = _.differenceBy(currentAgreements, latestAgreements, 'id')
    const latestOrderObj = data.latestPayload?.filter((line: any) => line.__typename === 'Order')[0]
    const currentOrderObj = data.order?.filter((line: any) => line.__typename === 'Order')[0]
    const newTransactions = _.differenceBy(currentOrderObj.transactions, latestOrderObj?.transactions, 'id')
    const actionGroups = groupAgreementsByAction(data.order, newAgreements, newTransactions)
    const extractedActionGroups = actionGroups.map((group) => {
        const newItems: any[] = []
        const returnedItems: any[] = []
        const refunds: any[] = []
        const saleTransactions: any[] = []
        const refundTransactions: any[] = []
        group.transactions.map((transaction: any) => {
            if (transaction.kind === 'REFUND') {
                refundTransactions.push(transaction)
            } else if (transaction.kind === 'SALE') {
                saleTransactions.push(transaction)
            }
        })
        group.agreements.map((agreement: any) => {
            const allSales = getAllSalesOfAgreement(data.order, agreement)
            if (agreement.__typename === 'OrderAgreement') {
                const orderSales = allSales.filter((sale: any) => sale.actionType === 'ORDER')
                newItems.push(...orderSales)
            }
            else if (agreement.__typename === 'RefundAgreement') {
                const negativeQuantitySales = allSales.filter((sale: any) => sale.actionType === 'RETURN' && sale.quantity < 0)
                if (negativeQuantitySales.length === allSales.length) {
                    returnedItems.push(...negativeQuantitySales)
                }
                refunds.push(agreement.refund)
            }
            else if (agreement.__typename === 'ReturnAgreement' || agreement.__typename === 'OrderEditAgreement') {
                const orderSales = allSales.filter((sale: any) => sale.actionType === 'ORDER')
                const returnSales = allSales.filter((sale: any) => sale.actionType === 'RETURN')
                newItems.push(...orderSales)
                returnedItems.push(...returnSales)
            }
        })

        return { orderName: currentOrderObj.name, newItems, returnedItems, refunds, saleTransactions, refundTransactions }
    })

    const requests = extractedActionGroups.map((group) => {
        let invoice: any, creditMemo: any, customerRefund: any
        if (group.newItems?.length > 0) {
            invoice = {
                orderName: group.orderName,
                data: {
                    items: group.newItems,
                    transactions: group.saleTransactions
                }
            }
        }
        if (group.returnedItems?.length > 0) {
            creditMemo = {
                orderName: group.orderName,
                data: {
                    items: group.returnedItems,
                    transactions: group.refundTransactions
                }
            }
        }
        if (group.refunds?.length) {
            customerRefund = {
                orderName: group.orderName,
                data: {
                    refunds: group.refunds,
                }
            }
        }

        return { invoice, creditMemo, customerRefund }
    })

    return requests
}

export async function pushRequestsToQueue(requests: any[]): Promise<any> {
    const handle = client.workflow.getHandle('process-request-queue')
    requests.forEach(async (request: any) => {
        const requestId = nanoid()
        for (const key of Object.keys(request)) {
            const value = request[key]
            // const latestPayload: any = await getLatestPayload(`order-${value.orderName}`, client) || {}
            // let internalId: string
            // if (key === 'creditMemo') {
            //     internalId = latestPayload['invoice']
            // } else if (key === 'customerRefund') {
            //     internalId = latestPayload['creditMemo']
            // }
            await handle.signal(addWaitingRequestSignal, {
                key: `${requestId}-${key}`,
                value: { value, ...{ id: requestId } }
            })
        }
        if (request.invoice) {
            await handle.signal(addInvoiceRequestSignal, { key: `${requestId}-invoice` })
        } else if (request.creditMemo) {
            await handle.signal(addCreditMemoRequestSignal, { key: `${requestId}-creditMemo` })
        }
    })
}
