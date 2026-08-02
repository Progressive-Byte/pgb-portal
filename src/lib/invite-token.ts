import { randomBytes } from "crypto";

export const INVITE_TOKEN_TTL_DAYS = 7;

export function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

export function inviteExpiryDate() {
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_TOKEN_TTL_DAYS);
  return expires;
}

export function inviteAcceptUrl(token: string) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${base}/invite/accept/${token}`;
}
