import { Client } from '@temporalio/client';
import axios from 'axios';
import { bulkOperationRunQuery, bulkOperation } from '../queries/queries';
import { prepareOrderWorkflow } from '../workflows/prepareOrder';
import _ from 'lodash';
import { getLatestPayload } from './common';

const client = new Client();

const host = 'vtldeveloper.myshopify.com';
const version = '2024-04';
const url = `https://${host}/admin/api/${version}`;
const accessToken = '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';
const headers = {
  'X-Shopify-Access-Token': accessToken,
  'Content-Type': 'application/json'
};

export async function getOrdersByGraphQLStep1(updateTime: string): Promise<any> {
  const query = bulkOperationRunQuery(updateTime);
  const data = JSON.stringify({
    query: query,
    variables: {}
  });
  const response = await axios.post(`${url}/graphql.json`, data, { headers: headers });
  return response.data;
}

export async function getOrdersByGraphQLStep2(bulkOperationId: string): Promise<any> {
  const query = bulkOperation(bulkOperationId);
  const data = JSON.stringify({
    query: query,
    variables: {}
  });
  let response: any;
  try {
    response = await axios.post(`${url}/graphql.json`, data, { headers: headers });
    if (response?.data?.data?.node?.status !== 'COMPLETED') {
      throw new Error('Step 2 result is not completed yet, retrying...');
    }
  } catch (error) {
    throw error;
  }
  return response.data;
}

export async function getOrdersByGraphQLStep3(url: string): Promise<any> {
  const response = await axios.get(url);
  return response.data;
}

export async function ndJSONtoJSON(ndjsonString: string) {
  const lines = ndjsonString.split('\n').filter(Boolean);
  const jsonObjects = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error('Invalid JSON in line:', line, error);
      return null;
    }
  }).filter(Boolean);

  return jsonObjects;
}

export async function groupPayloadByOrder(payload: any[]) {
  const parents = payload.filter((line) => !line.__parentId)
  return parents.map((parent) => {
    const children = payload.filter((line) => line.__parentId === parent.id)
    const descendants = children.map((child) => {
      const grandChildren = payload.filter((line) => line.__parentId === child.id)
      return [child, ...grandChildren]
    })
    return [parent, ...descendants.flat()]
  })
}

async function executePrepareOrderWorkflow(data: any, workflowId: string) {
  try {
    const workflow = await client.workflow.execute(prepareOrderWorkflow, {
      taskQueue: 'prepare-order-task',
      workflowId,
      args: [data],
    });
    return workflow;
  } catch (error) {
    return null
  }
}

export async function prepareSingleOrder(order: any[]) {
  const workflowId = `order-${order[0].name}`
  const latestPayload = await getLatestPayload(workflowId, client)
  if (!latestPayload || !_.isEqual(latestPayload, order)) {
    const newOrderPayload = await executePrepareOrderWorkflow({ order, latestPayload }, workflowId)
    return newOrderPayload
  }
  return null
}
