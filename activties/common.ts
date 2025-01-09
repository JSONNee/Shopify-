export async function getLatestPayload(workflowId: string, client: any) {
    try {
      const workflowHandle = client.workflow.getHandle(workflowId);
      const history = await workflowHandle.fetchHistory();
      const completedEvent = history?.events?.reverse().find((event: any) => event.eventType === 2);
      const payload = completedEvent?.workflowExecutionCompletedEventAttributes?.result?.payloads?.[0];
      const result = payload?.data ? JSON.parse(Buffer.from(payload.data).toString('utf-8')) : null;
      return result;
    } catch (error) {
      return null
    }
  }
  
