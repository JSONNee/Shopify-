export const fetchOrdersQuery = (input: string, cursor: string | null) => `{ 
    orders(first: 5,after:${cursor}, query: "updated_at:>'${input}'",  sortKey: UPDATED_AT) {
        edges{
        node {
            id
            name
            createdAt
            updatedAt
            customer {
            firstName
            lastName
            email
            }
        }
        cursor
        }
        pageInfo{
            hasNextPage
        }
    }
}`;
//2024-10-22T05:50:00Z
//AND updated_at:<'2024-10-22T05:50:47Z'

export const bulkOperationRunQuery = (query: string) => `mutation {
  bulkOperationRunQuery(
    query:"""
    {
      orders(query: "updated_at:>'${query}'", sortKey: UPDATED_AT ) {
        edges {
          node {
            id
            name
            updatedAt
            __typename
            netsuiteParentOrderInternalId: metafield(
                namespace: "order_sync_to_ns"
                key: "netsuiteParentOrderInternalId"
            ) {
                id
                value
            }
            netsuiteSiblingOrderInternalId: metafield(
                namespace: "order_sync_to_ns"
                key: "netsuiteSiblingOrderInternalId"
            ) {
                id
                value
            }
            shopifyRefundIds: metafield(
                namespace: "order_sync_to_ns"
                key: "shopifyRefundIds"
            ) {
                id
                value
            }
             refunds {
                id
                createdAt
                note
                totalRefundedSet {
                    presentmentMoney {
                        amount
                        currencyCode
                    }
                    shopMoney {
                        amount
                        currencyCode
                    }
                }
            }
            agreements {
              edges {
                node {
                  __typename
                  id
                  happenedAt
                  reason
                  app {
                    handle
                  }
                  ...on OrderAgreement {
                      order {
                            id
                            app {
                                id
                                name
                            }
                            name
                            channelInformation {
                                id
                                channelId
                                channelDefinition {
                                    id
                                    channelName
                                    handle
                                    subChannelName
                                    isMarketplace
                                }
                                app {
                                    id
                                    description
                                    title
                                }

                            }
                            refundable
                            billingAddress {
                                name
                                address1
                                address2
                                city
                                country
                                province
                                zip
                            }
                            cancelReason
                            cancelledAt
                            customer {
                                id
                                email
                                firstName
                                lastName
                                phone
                                companyContactProfiles {
                                    company {
                                        name
                                    }
                                }
                            }
                            displayFinancialStatus
                            displayFulfillmentStatus
                            phone
                            poNumber
                            createdAt
                            processedAt
                            updatedAt
                            tags
                            note
                            sourceIdentifier
                            physicalLocation {
                                id,
                                name
                            }
                            merchantOfRecordApp {
                                id
                                name

                            }
                            customerJourneySummary {
                                firstVisit {
                                    referrerUrl
                                }
                                lastVisit {
                                    referrerUrl

                                }

                            }
                            customAttributes {
                                key
                                value

                            }
                            registeredSourceUrl
                            paymentGatewayNames
                            currencyCode
                            presentmentCurrencyCode                          
                            discountCode
                            discountCodes
                            shippingAddress {
                                firstName
                                lastName
                                phone
                                address1
                                address2
                                company
                                province
                                provinceCode
                                city
                                zip
                                country
                                latitude
                                longitude
                            }
                            transactions {
                                gateway
                                kind
                                paymentId
                                }

                            fulfillments {
                                trackingInfo {
                                    company
                                    number
                                    url

                                }

                            }
                      }
                  }
                  ...on RefundAgreement {
                    refund {
                        id
                        createdAt
                        note
                        duties {
                            amountSet {
                                presentmentMoney {
                                        amount
                                        currencyCode
                                    }
                                shopMoney {
                                    amount
                                    currencyCode
                                }

                            }
                            originalDuty {
                                countryCodeOfOrigin
                                harmonizedSystemCode
                                price {
                                    presentmentMoney {
                                        amount
                                        currencyCode
                                    }
                                    shopMoney {
                                        amount
                                        currencyCode
                                    }
                                } 
                                taxLines {
                                    priceSet {
                                        presentmentMoney {
                                        amount
                                        currencyCode
                                    }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }

                                    }

                                }                      
                            }
                        }
                        order {
                          id
                          name
                          paymentGatewayNames
                          displayFinancialStatus
                          displayFulfillmentStatus
                          app {
                            id
                            name
                            }
                          physicalLocation {
                              id
                              name
                          }
                          channelInformation {
                                id
                                channelId
                                channelDefinition {
                                    id
                                    channelName
                                    handle
                                    subChannelName
                                    isMarketplace
                                }
                                app {
                                    id
                                    description
                                    title
                                }

                            }
                          transactions {
                            gateway
                            kind
                            paymentId
                            amountSet {
                                presentmentMoney {
                                        amount
                                        currencyCode
                                    }
                                shopMoney {
                                    amount
                                    currencyCode
                                }

                            }
                            }

                         fulfillments {
                             trackingInfo {
                                 company
                                 number
                                 url

                             }

                         }

                      }
                        return {
                            id
                            status
                            order {
                                id

                            }

                        }
                        transactions {
                            edges {
                                node {
                                    __typename
                                    paymentId
                                    kind
                                    gateway
                                    amountSet {
                                        presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                                    }
                                    accountNumber

                                }
                            }
                        }
                        refundLineItems {                         
                           edges {
                               node {
                                    __typename
                                   restocked
                                   restockType
                                   location {
                                       id
                                       name
                                   }
                               }
                           }
                        }
                    }
                  }
                  sales {
                    edges {
                        node {
                            __typename
                            id
                            lineType
                            actionType
                            quantity
                            totalDiscountAmountBeforeTaxes {
                                presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                            }
                            totalTaxAmount {
                                presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                            }
                            totalAmount {
                                presentmentMoney {
                                    amount
                                    currencyCode
                                }
                                shopMoney {
                                            amount
                                            currencyCode
                                        }
                            }
                            ...on GiftCardSale {
                                lineItem {
                                    id
                                    sku
                                    name
                                    quantity
                                    currentQuantity
                                    product {
                                        isGiftCard
                                        vendor
                                        productType
                                        tags
                                    }
                                    variant {
                                        id
                                        title
                                    }
                                    discountedTotalSet {
                                        presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                                    }
                                    originalUnitPriceSet {
                                        presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                                    }
                                    taxLines {
                                        rate
                                        title
                                        priceSet {
                                            presentmentMoney {
                                                amount
                                                currencyCode
                                            }
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                    discountAllocations {
                    allocatedAmountSet {
                        presentmentMoney {
                            amount
                            currencyCode
                        }
                    }
                                        discountApplication {
                                            __typename
                                            index
                                            ...on AutomaticDiscountApplication {
                                                title
                                            }
                                            ...on ManualDiscountApplication {
                                                title
                                            }
                                            ...on ScriptDiscountApplication {
                                                title
                                            }
                                            ...on DiscountCodeApplication {
                                                code
                                            }
                                        }
                                    }
                                }
                            }
                            ...on ProductSale {
                                lineItem {
                                    id
                                    currentQuantity
                                    sku
                                    name
                                    quantity
                                    restockable
                                    product {
                                        isGiftCard
                                        vendor
                                        productType
                                        tags
                                    }
                                    variant {
                                        id
                                        title
                                    }
                                    duties {
                                        harmonizedSystemCode
                                        countryCodeOfOrigin
                                        price {
                                            presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }

                                        }
                                        taxLines {
                                            rate
                                            ratePercentage
                                            title
                                            priceSet {
                                                presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                                shopMoney {
                                                    amount
                                                    currencyCode
                                                }

                                            }

                                        }
                                    }
                                    discountedTotalSet {
                                        presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                                    }
                                    originalUnitPriceSet {
                                        presentmentMoney {
                                            amount
                                            currencyCode
                                        }
                                        shopMoney {
                                            amount
                                            currencyCode
                                        }
                                    }
                                    taxLines {
                                        rate
                                        title
                                        priceSet {
                                            presentmentMoney {
                                                amount
                                            }
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                    }
                                    discountAllocations {
                                        allocatedAmountSet {
                                            presentmentMoney {
                                                amount
                                                currencyCode
                                            }
                                            shopMoney {
                                                amount
                                                currencyCode
                                            }
                                        }
                                        discountApplication {
                                            __typename
                                            value {
                                                ... on MoneyV2 {
                                                amount
                                                currencyCode
                                                }
                                                ... on PricingPercentageValue {
                                                percentage
                                                }

                                                }
                                            allocationMethod
                                            index
                                            ...on AutomaticDiscountApplication {
                                                title
                                                
                                            }
                                            ...on ManualDiscountApplication {
                                                title
                                                description
                                            }
                                            ...on ScriptDiscountApplication {
                                                title
                                            }
                                            ...on DiscountCodeApplication {
                                                code
                                            }
                                        }
                                    }
                                }
                            }
                            ... on ShippingLineSale {
                                    shippingLine {
                                        carrierIdentifier
                                        requestedFulfillmentService {
                                            id
                                            serviceName
                                        }
                                        source
                                        code
                                        title
                                        discountedPriceSet {
                                            presentmentMoney {
                                                    amount
                                                }
                                                shopMoney {
                                                    amount
                                                    currencyCode
                                                }
                                        }
                                        taxLines {
                                            rate
                                            title
                                            priceSet {
                                                presentmentMoney {
                                                    amount
                                                }
                                                shopMoney {
                                                    amount
                                                    currencyCode
                                                }
                                            }
                                    }
                                        discountAllocations {
                                            allocatedAmountSet {
                                                presentmentMoney {
                                                    amount
                                                    currencyCode
                                                }
                                                shopMoney {
                                                    amount
                                                    currencyCode
                                                }
                                            }
                                        discountApplication {
                                            __typename
                                            value {
                                                ... on MoneyV2 {
                                                amount
                                                currencyCode
                                                }
                                                ... on PricingPercentageValue {
                                                percentage
                                                }

                                                }
                                            allocationMethod
                                            index
                                            ...on AutomaticDiscountApplication {
                                                title
                                                
                                            }
                                            ...on ManualDiscountApplication {
                                                title
                                                description
                                            }
                                            ...on ScriptDiscountApplication {
                                                title
                                            }
                                            ...on DiscountCodeApplication {
                                                code
                                            }
                                        }
                                    }
                                    }

                            }
                        }
                    }
                  }
                }
              }
            }
            transactions {
              id
              #user {
              #    id
              #}
              status
              amountSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
                shopMoney {
                    amount
                    currencyCode
                }
              }
              gateway
              formattedGateway
              kind
              paymentDetails
              parentTransaction {
                  gateway
                  id
                  paymentId
                  receiptJson

              }
              paymentId
            createdAt
            }
          }
        }
      }
    }
    """
  ) {
    bulkOperation {
      id
      status
      createdAt
      completedAt
    }
    userErrors {
      field
      message
    }
}}`;

export const bulkOperation = (id: string) => `{ 
    node(id: "${id}") {
    ... on BulkOperation {        
            id        
            status        
            errorCode        
            createdAt        
            completedAt        
            objectCount       
            fileSize       
            url        
            partialDataUrl    
        }
    }
}`;
