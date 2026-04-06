/**
 * Notification helpers for the PBW Dropshipper Portal.
 *
 * Uses the built-in platform notification API (notifyOwner) to send
 * owner/admin-facing alerts whenever an order is updated. These notifications
 * appear in the project owner's notification feed.
 *
 * For agent-facing notifications, the message body includes the agent's name
 * and email so the admin can follow up directly if needed.
 */

import { notifyOwner } from "./_core/notification";

/**
 * Notify the portal owner/admin about changes to an agent's order.
 * Includes the agent's contact info so the admin can relay the update.
 */
export async function sendOrderNotification(
  agentEmail: string,
  agentName: string,
  orderNo: string,
  changes: string[]
): Promise<boolean> {
  const changeList = changes.map((c) => `• ${c}`).join("\n");

  const title = `Order Update: ${orderNo}`;
  const content = [
    `Agent: **${agentName}** (${agentEmail})`,
    `Order: **${orderNo}**`,
    ``,
    `Changes made:`,
    changeList,
    ``,
    `Please notify the agent if they have not been reached automatically.`,
  ].join("\n");

  try {
    return await notifyOwner({ title, content });
  } catch {
    // Notification failure should not block order updates
    console.warn("[Notifications] Failed to send order notification for", orderNo);
    return false;
  }
}

/**
 * Notify about a status change on an agent's order.
 */
export async function sendStatusChangeNotification(
  agentEmail: string,
  agentName: string,
  orderNo: string,
  newStatus: string
): Promise<boolean> {
  return sendOrderNotification(agentEmail, agentName, orderNo, [
    `Order status changed to **${newStatus}**`,
  ]);
}

/**
 * Notify about cashback being assigned to an agent's order.
 */
export async function sendCashbackNotification(
  agentEmail: string,
  agentName: string,
  orderNo: string,
  cashbackAmount: number
): Promise<boolean> {
  return sendOrderNotification(agentEmail, agentName, orderNo, [
    `Cashback of ₹${cashbackAmount} has been assigned`,
  ]);
}

/**
 * Notify about a tracking number being added to an agent's order.
 */
export async function sendTrackingNotification(
  agentEmail: string,
  agentName: string,
  orderNo: string,
  trackingNumber: string
): Promise<boolean> {
  return sendOrderNotification(agentEmail, agentName, orderNo, [
    `Tracking number **${trackingNumber}** has been added`,
  ]);
}
