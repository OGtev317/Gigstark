import type { STRK20_ACTION } from "starknet";

export const STRK_MAINNET_TOKEN =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" as const;

export type PaymentOperation = "shield" | "pay" | "withdraw";

export function parseStrkAmount(value: string): string {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(normalized)) {
    throw new Error("INVALID_STRK_AMOUNT");
  }
  const [whole = "0", fraction = ""] = normalized.split(".");
  const amount = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0") || "0");
  if (amount <= 0n || amount >= 1n << 128n) throw new Error("INVALID_STRK_AMOUNT");
  return `0x${amount.toString(16)}`;
}

export function formatStrkAmount(value: string): string {
  const amount = BigInt(value);
  const whole = amount / 10n ** 18n;
  const fraction = (amount % 10n ** 18n).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function buildSimplePaymentActions(
  operation: PaymentOperation,
  amount: string,
  recipient?: string,
): STRK20_ACTION[] {
  const rawAmount = parseStrkAmount(amount);
  if (operation === "shield") {
    return [{ type: "deposit", token: STRK_MAINNET_TOKEN, amount: rawAmount }];
  }
  const target = requireAddress(recipient);
  if (operation === "pay") {
    return [{ type: "transfer", token: STRK_MAINNET_TOKEN, amount: rawAmount, recipient: target }];
  }
  return [{ type: "withdraw", token: STRK_MAINNET_TOKEN, amount: rawAmount, recipient: target }];
}

export function receiptTouchesPool(receipt: unknown, poolAddress: string): boolean {
  if (!receipt || typeof receipt !== "object") return false;
  const record = receipt as Record<string, unknown>;
  if (record.execution_status === "REVERTED") return false;
  if (record.execution_status !== "SUCCEEDED") return false;
  const events = Array.isArray(record.events) ? record.events : [];
  return events.some((event) => {
    if (!event || typeof event !== "object") return false;
    const from = (event as Record<string, unknown>).from_address;
    return typeof from === "string" && sameFelt(from, poolAddress);
  });
}

function requireAddress(value?: string): string {
  if (!value) throw new Error("RECIPIENT_REQUIRED");
  try {
    const parsed = BigInt(value);
    if (parsed <= 0n || parsed >= 1n << 251n) throw new Error();
    return `0x${parsed.toString(16)}`;
  } catch {
    throw new Error("INVALID_RECIPIENT");
  }
}

function sameFelt(left: string, right: string): boolean {
  try {
    return BigInt(left) === BigInt(right);
  } catch {
    return false;
  }
}
