import { splitBy, contains, upper, isEmpty, substringAfterLast } from './utils';
 
export async function ndJSONtoJSON(ndjsonString: string) {
    // Split the NDJSON string by newlines to get individual JSON objects
    const lines = ndjsonString.split('\n').filter(Boolean); // Filter to remove any empty lines
 
    // Parse each line as JSON and store it in an array
    const jsonObjects = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch (error) {
            console.error('Invalid JSON in line:', line, error);
            return null;
        }
    }).filter(Boolean); // Remove null values caused by parsing errors
 
    return jsonObjects;
}
 
export async function transformOrder(payload: any, goLiveDate: Date) {
    // Constants
    const salesAgreementTypeName = ['OrderEditAgreement', 'RefundAgreement', 'ReturnAgreement'];
    const salesTypeName = [
        'AdditionalFeeSale', 'AdjustmentSale', 'DutySale', 'FeeSale',
        'GiftCardSale', 'ProductSale', 'ShippingLineSale', 'TipSale', 'UnknownSale'
    ];
 
    // Function to get sales of an agreement
    const getSalesOfAgreement = (payload: any[], agreement: any, quantityType: string = '') => {
        let tempSales = payload?.filter(line => salesTypeName?.includes(line?.__typename) && line?.__parentId === agreement?.id);
 
        let sales = tempSales;
        if (quantityType === 'positive') {
            sales = tempSales?.filter(sale => !isEmpty(sale?.quantity) && sale?.quantity > 0);
        } else if (quantityType === 'negative') {
            sales = tempSales?.filter(sale => isEmpty(sale?.quantity) || sale?.quantity < 0);
        }
 
        return sales?.map(sale => ({ [sale?.__typename]: sale }));
    };
 
    // Function to filter sales agreements
    const filterSalesAgreements = (payload: any[], order: any, handle: string) => {
        return payload
            ?.filter(line => salesAgreementTypeName?.includes(line?.__typename) && line?.app?.handle === handle && line?.__parentId === order?.id)
            ?.sort((a, b) => new Date(a?.happenedAt)?.getTime() - new Date(b?.happenedAt)?.getTime());
    };
 
    // Function to group agreements, including the goLiveDate condition
    const groupAgreements = (agreements: any[], goLiveDate: Date) => {
        return agreements
            ?.map((agreement, index) => {
                if (agreement?.__typename === 'OrderEditAgreement' && new Date(agreement?.happenedAt) >= goLiveDate) {
                    return { ...agreement, groupIndex: index };
                } else if (agreement?.__typename === 'ReturnAgreement') {
                    return { ...agreement, groupIndex: index };
                } else if (agreement?.__typename === 'RefundAgreement') {
                    if (index - 2 >= 0 && agreements[index - 2]?.__typename === 'OrderEditAgreement' && new Date(agreements[index - 2]?.happenedAt) >= goLiveDate) {
                        return { ...agreement, groupIndex: index - 2 };
                    } else if (index - 1 >= 0 && agreements[index - 1]?.__typename === 'ReturnAgreement') {
                        return { ...agreement, groupIndex: index - 1 };
                    } else {
                        return { ...agreement, groupIndex: index };
                    }
                } else {
                    return null;
                }
            })
            ?.filter(agreement => !isEmpty(agreement))
            ?.reduce((acc: any, agreement: any) => {
                if (!acc[agreement?.groupIndex]) {
                    acc[agreement?.groupIndex] = [];
                }
                acc[agreement?.groupIndex]?.push(agreement);
                return acc;
            }, {});
    };
 
    // Main transformation function
    const transformPayload = (payload: any[]) => {
        return payload
            ?.filter(line => isEmpty(line?.__parentId))
            ?.map(order => {
                // Filter and group agreements
                const originalOnlineSalesAgreements = filterSalesAgreements(payload, order, 'shopify_web');
                const originalPosSalesAgreements = filterSalesAgreements(payload, order, 'pos');
 
                // Group with goLiveDate condition applied
                const groupedOnlineSalesAgreements = groupAgreements(originalOnlineSalesAgreements, goLiveDate);
                const groupedPosSalesAgreements = groupAgreements(originalPosSalesAgreements, goLiveDate);
 
                const onlineRefundAgreements = processRefundAgreements(groupedOnlineSalesAgreements, payload);
                const posRefundAgreements = processRefundAgreements(groupedPosSalesAgreements, payload);
 
                const refundAgreements = {
                    refundAgreements: [...onlineRefundAgreements, ...posRefundAgreements]?.sort((a, b) => {
                        const aTime = a?.happenedAt || a?.orderEditAgreement?.happenedAt;
                        const bTime = b?.happenedAt || b?.orderEditAgreement?.happenedAt;
                        return new Date(aTime)?.getTime() - new Date(bTime)?.getTime();
                    })
                };
 
                // Handling Order Agreement
                const originalOrderAgreement = payload?.find(line => line?.__typename === 'OrderAgreement' && line?.__parentId === order?.id);
                const orderAgreement = {
                    orderAgreement: {
                        ...originalOrderAgreement,
                        sales: getSalesOfAgreement(payload, originalOrderAgreement)
                    }
                };
 
                // Handling Order Edit Agreements
                const originalOrderEditAgreements = payload?.filter(line => line?.__typename === 'OrderEditAgreement' && line?.__parentId === order?.id && line?.app?.handle !== 'pos');
                const orderItemsAddedAgreement = {
                    orderItemsAddedAgreement: originalOrderEditAgreements?.map(originalOrderEditAgreement => ({
                        ...originalOrderEditAgreement,
                        sales: getSalesOfAgreement(payload, originalOrderEditAgreement)
                    }))
                };
 
                return {
                    ...order,
                    ...orderAgreement,
                    ...refundAgreements,
                    ...orderItemsAddedAgreement
                };
            });
    };
 
    // Helper function to process refund agreements
    const processRefundAgreements = (groupedAgreements: any, payload: any[]) => {
        return Object?.values(groupedAgreements)?.map((agreementGroup: any) => {
            const refundAgreement = agreementGroup?.find((agreement: any) => agreement?.__typename === 'RefundAgreement');
            const returnAgreement = agreementGroup?.find((agreement: any) => agreement?.__typename === 'ReturnAgreement');
 
            const returnAgreementWithSales = returnAgreement
                ? { ...returnAgreement, sales: getSalesOfAgreement(payload, returnAgreement, 'positive') }
                : null;
 
            const refundTransactions = payload?.filter(line => line?.__parentId === refundAgreement?.id && line?.__typename === 'OrderTransaction');
 
            return refundAgreement
                ? {
                    ...refundAgreement,
                    sales: getSalesOfAgreement(payload, refundAgreement, 'negative'),
                    refundLineItems: payload?.filter(line => line?.__parentId === refundAgreement?.id && line?.__typename === 'RefundLineItem'),
                    refundTransactions: refundTransactions?.length ? refundTransactions : null,
                    orderEditAgreement: returnAgreementWithSales
                }
                : {
                    orderEditAgreement: returnAgreementWithSales
                };
        });
    };
 
    return transformPayload(payload)
}
 
// Main transformation function
export async function filterOrder(payload: any) {
    // Step 1: Split strings into arrays
    const shopifyTransactionIdsArray = splitBy(payload?.shopifyTransactionIds?.value, ',');
    const shopifyRefundIdsArray = splitBy(payload?.shopifyRefundIds?.value, ',');
    const shopifyOrderEditSalesAgreementIdsArray = payload?.shopifyOrderEditSalesAgreementIds?.value;
 
    // Step 2: Remove transactions, refundAgreements, and optionally orderItemsAddedAgreement
    let newPayload: any = {};
    if (!isEmpty(shopifyOrderEditSalesAgreementIdsArray)) {
        newPayload = { ...payload };
        delete newPayload?.['transactions'];
        delete newPayload?.['refundAgreements'];
        delete newPayload?.['orderItemsAddedAgreement'];
    } else {
        newPayload = { ...payload };
        delete newPayload?.['transactions'];
        delete newPayload?.['refundAgreements'];
    }
 
    // Step 3: Filter transactions without AWAITING_RESPONSE
    const filteredTransWithOutAwaitRes = payload?.transactions?.filter((tx: any) => tx?.status !== 'AWAITING_RESPONSE');
 
    // Step 4: Remove duplicate payment IDs
    const filteredTransWithOutDupPaymentIds = filteredTransWithOutAwaitRes?.reduce((acc: any[], curr: any) => {
        const isUnique = !acc?.some((tx: any) => tx?.paymentId === curr?.paymentId);
        if (isUnique) {
            acc?.push(curr);
        }
        return acc;
    }, []);
 
    // Step 5: Filter transactions
    const filteredTransactions = filteredTransWithOutDupPaymentIds?.filter((tx: any) =>
        !contains(shopifyTransactionIdsArray, substringAfterLast(tx?.id, "/")) &&
        upper(tx?.status) === "SUCCESS" && upper(tx?.kind) !== "AUTHORIZATION"
    );
 
    // Step 6: Filter refund agreements
    const filteredRefundAgreements = payload?.refundAgreements?.filter((refund: any) =>
        !contains(shopifyRefundIdsArray, substringAfterLast(refund?.refund?.id, "/"))
    );
 
    // Step 7: Handle filteredRefundAgreementsWithoutOrderEdited
    let filteredRefundAgreementsWithoutOrderEdited: any = null;
    if (!isEmpty(shopifyOrderEditSalesAgreementIdsArray) && filteredRefundAgreements?.[0]?.orderEditAgreement) {
        if (contains(shopifyOrderEditSalesAgreementIdsArray, substringAfterLast(filteredRefundAgreements?.[0]?.orderEditAgreement?.id, "/"))) {
            filteredRefundAgreementsWithoutOrderEdited = filteredRefundAgreements?.map((refund: any) => {
                const { orderEditAgreement, ...rest } = refund;
                return rest;
            });
        }
    }
 
    // Combine newPayload with filtered transactions and refund agreements
    return {
        ...newPayload,
        ...(filteredTransactions?.length > 0 && { transactions: filteredTransactions }),
        ...(filteredRefundAgreementsWithoutOrderEdited && { refundAgreements: filteredRefundAgreementsWithoutOrderEdited }),
        ...(!filteredRefundAgreementsWithoutOrderEdited && filteredRefundAgreements?.length > 0 && { refundAgreements: filteredRefundAgreements })
    };
}
