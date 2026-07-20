import { Resend } from "resend";

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}
