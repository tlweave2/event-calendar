import { Resend } from "resend";
import { captureError, logInfo, withRetry } from "@/lib/observability";

const FROM = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Single path for outbound mail.
 *
 * Sends are retried, and a send that ultimately fails is reported rather than
 * swallowed — a dropped password reset or dunning notice is invisible to us
 * and very visible to the customer.
 */
async function send({
  to,
  subject,
  html,
  kind,
}: {
  to: string;
  subject: string;
  html: string;
  kind: string;
}): Promise<void> {
  if (!resend) {
    logInfo("email skipped, RESEND_API_KEY not set", { scope: "email", kind, to });
    return;
  }

  try {
    await withRetry(
      async () => {
        const result = await resend.emails.send({ from: FROM, to, subject, html });
        // The Resend SDK reports failures on the result rather than throwing,
        // so a bad address or domain would otherwise look like success.
        if (result.error) throw new Error(result.error.message);
        return result;
      },
      { scope: `email.${kind}`, attempts: 3 }
    );

    logInfo("email sent", { scope: "email", kind, to });
  } catch (err) {
    await captureError(err, { scope: "email", kind, to, subject });
  }
}

type SubmissionConfirmationProps = {
  to: string;
  submitterName: string;
  eventTitle: string;
  eventId: string;
  tenantName: string;
};

type ModerationNoticeProps = {
  to: string;
  submitterName: string;
  eventTitle: string;
  tenantName: string;
  action: "approved" | "rejected";
  calendarUrl?: string;
};

type InviteEmailProps = {
  to: string;
  tenantName: string;
  role: string;
  inviteUrl: string;
};

type AdminNotificationProps = {
  to: string;
  eventTitle: string;
  submitterName: string;
  tenantName: string;
  adminUrl: string;
};

type PasswordResetProps = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type EmailVerificationProps = {
  to: string;
  tenantName: string;
  verifyUrl: string;
};

type WelcomeProps = {
  to: string;
  tenantName: string;
  calendarUrl: string;
  adminUrl: string;
};

type PaymentReceiptProps = {
  to: string;
  tenantName: string;
  amount: string;
  invoiceUrl: string | null;
  periodEnd: string | null;
};

type PaymentFailedProps = {
  to: string;
  tenantName: string;
  amount: string;
  updatePaymentUrl: string;
  graceEnds: string | null;
};

type SubscriptionEndedProps = {
  to: string;
  tenantName: string;
  reason: "canceled" | "unpaid";
  resubscribeUrl: string;
};

type LimitWarningProps = {
  to: string;
  tenantName: string;
  used: number;
  limit: number;
  upgradeUrl: string;
};

function submissionConfirmationHtml({
  submitterName,
  eventTitle,
  eventId,
  tenantName,
}: Omit<SubmissionConfirmationProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Event Received</h2>
      <p style="color:#555;margin-top:0">Hi ${submitterName},</p>
      <p>Your event has been submitted to <strong>${tenantName}</strong> and is pending review.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px">Event</td>
          <td style="padding:8px 12px;background:#f5f5f5">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600">Reference</td>
          <td style="padding:8px 12px;font-family:monospace">${eventId.slice(0, 8).toUpperCase()}</td>
        </tr>
      </table>
      <p style="font-size:14px;color:#555">
        You'll receive another email once your event has been reviewed.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent by ${tenantName} via Event Calendar</p>
    </div>
  `;
}

function moderationNoticeHtml({
  submitterName,
  eventTitle,
  tenantName,
  action,
  calendarUrl,
}: Omit<ModerationNoticeProps, "to">) {
  const approved = action === "approved";

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">
        Event ${approved ? "Approved ✓" : "Not Approved"}
      </h2>
      <p style="color:#555;margin-top:0">Hi ${submitterName},</p>
      ${
        approved
          ? `<p>Great news - <strong>${eventTitle}</strong> has been approved and is now listed on the ${tenantName} calendar.</p>
             ${calendarUrl ? `<p><a href="${calendarUrl}" style="color:#2563eb">View the calendar -></a></p>` : ""}`
          : `<p>Unfortunately, <strong>${eventTitle}</strong> was not approved for the ${tenantName} calendar at this time.</p>
             <p style="font-size:14px;color:#555">If you have questions, please contact the calendar administrator.</p>`
      }
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent by ${tenantName} via Event Calendar</p>
    </div>
  `;
}

function inviteEmailHtml({ tenantName, role, inviteUrl }: Omit<InviteEmailProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">You're invited</h2>
      <p style="color:#555;margin-top:0">You have been invited to join <strong>${tenantName}</strong> as <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}" style="color:#2563eb">Accept invitation and set your password -></a></p>
      <p style="font-size:14px;color:#555">This link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent by ${tenantName} via Event Calendar</p>
    </div>
  `;
}

function adminNotificationHtml({
  eventTitle,
  submitterName,
  tenantName,
  adminUrl,
}: Omit<AdminNotificationProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">New Event Submission</h2>
      <p style="color:#555">A new event has been submitted to <strong>${tenantName}</strong> and needs your review.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:140px">Event</td>
          <td style="padding:8px 12px;background:#f5f5f5">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600">Submitted by</td>
          <td style="padding:8px 12px">${submitterName}</td>
        </tr>
      </table>
      <p><a href="${adminUrl}" style="background:#1a1a18;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Review in dashboard -&gt;</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent by ${tenantName} via Event Calendar</p>
    </div>
  `;
}

function passwordResetHtml({ resetUrl, expiresInMinutes }: Omit<PasswordResetProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Reset your password</h2>
      <p style="color:#555">We received a request to reset the password for this account.</p>
      <p><a href="${resetUrl}" style="background:#1a1a18;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Choose a new password</a></p>
      <p style="font-size:14px;color:#555">This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
      <p style="font-size:14px;color:#555">If you did not request a reset, you can safely ignore this email — your password will not change.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function emailVerificationHtml({ tenantName, verifyUrl }: Omit<EmailVerificationProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Confirm your email</h2>
      <p style="color:#555">Thanks for creating <strong>${tenantName}</strong>. Confirm your email address to finish setting up your calendar.</p>
      <p><a href="${verifyUrl}" style="background:#1a1a18;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Confirm email address</a></p>
      <p style="font-size:14px;color:#555">This link expires in 24 hours.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function welcomeHtml({ tenantName, calendarUrl, adminUrl }: Omit<WelcomeProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Your calendar is live</h2>
      <p style="color:#555;margin-top:0"><strong>${tenantName}</strong> is set up and ready to take event submissions.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:150px">Your calendar</td>
          <td style="padding:8px 12px;background:#f5f5f5"><a href="${calendarUrl}" style="color:#2563eb">${calendarUrl}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600">Dashboard</td>
          <td style="padding:8px 12px"><a href="${adminUrl}" style="color:#2563eb">Review submissions</a></td>
        </tr>
      </table>
      <p style="font-size:14px;color:#555">Three things worth doing next:</p>
      <ol style="font-size:14px;color:#555;padding-left:20px;line-height:1.8">
        <li>Add your logo and colors under Branding</li>
        <li>Copy your embed code and paste it into your website</li>
        <li>Share your submission link so people can add events</li>
      </ol>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function paymentReceiptHtml({
  tenantName,
  amount,
  invoiceUrl,
  periodEnd,
}: Omit<PaymentReceiptProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Payment received</h2>
      <p style="color:#555;margin-top:0">Thanks — your payment for <strong>${tenantName}</strong> went through.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:150px">Amount</td>
          <td style="padding:8px 12px;background:#f5f5f5">${amount}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-weight:600">Plan</td>
          <td style="padding:8px 12px">Pro</td>
        </tr>
        ${
          periodEnd
            ? `<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Renews</td><td style="padding:8px 12px;background:#f5f5f5">${periodEnd}</td></tr>`
            : ""
        }
      </table>
      ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="color:#2563eb">View invoice -&gt;</a></p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function paymentFailedHtml({
  tenantName,
  amount,
  updatePaymentUrl,
  graceEnds,
}: Omit<PaymentFailedProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">Your payment didn't go through</h2>
      <p style="color:#555;margin-top:0">We couldn't charge the card on file for <strong>${tenantName}</strong> (${amount}).</p>
      <p style="font-size:14px;color:#555">
        Your calendar is still running${graceEnds ? ` until <strong>${graceEnds}</strong>` : ""}. Update
        your card and we'll retry automatically — nothing else to do.
      </p>
      <p><a href="${updatePaymentUrl}" style="background:#1a1a18;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">Update payment method</a></p>
      <p style="font-size:14px;color:#555">
        If the payment isn't recovered, the calendar drops to the Free plan. Your
        events stay put — you just lose unlimited events and the Pro features.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function subscriptionEndedHtml({
  tenantName,
  reason,
  resubscribeUrl,
}: Omit<SubscriptionEndedProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">
        ${reason === "canceled" ? "Your subscription is canceled" : "Your subscription has ended"}
      </h2>
      <p style="color:#555;margin-top:0">
        <strong>${tenantName}</strong> is now on the Free plan.
        ${
          reason === "unpaid"
            ? "We weren't able to recover the payment after several attempts."
            : "Sorry to see you go."
        }
      </p>
      <p style="font-size:14px;color:#555">
        Nothing has been deleted. Your events, categories, and embed are all
        still there — the Free plan allows 5 events per month and shows the
        Eventful badge.
      </p>
      <p><a href="${resubscribeUrl}" style="color:#2563eb">Reactivate Pro -&gt;</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

function limitWarningHtml({
  tenantName,
  used,
  limit,
  upgradeUrl,
}: Omit<LimitWarningProps, "to">) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin-bottom:4px">You're close to your monthly limit</h2>
      <p style="color:#555;margin-top:0">
        <strong>${tenantName}</strong> has used <strong>${used} of ${limit}</strong>
        events this month.
      </p>
      <p style="font-size:14px;color:#555">
        Once you hit the limit, new submissions are turned away until the month
        resets. Pro removes the cap entirely.
      </p>
      <p><a href="${upgradeUrl}" style="background:#1a1a18;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">See Pro</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Sent via Event Calendar</p>
    </div>
  `;
}

export async function sendWelcomeEmail(props: WelcomeProps) {
  await send({
    to: props.to,
    subject: `${props.tenantName} is ready`,
    html: welcomeHtml(props),
    kind: "welcome",
  });
}

export async function sendPaymentReceipt(props: PaymentReceiptProps) {
  await send({
    to: props.to,
    subject: `Payment received for ${props.tenantName}`,
    html: paymentReceiptHtml(props),
    kind: "payment-receipt",
  });
}

export async function sendPaymentFailed(props: PaymentFailedProps) {
  await send({
    to: props.to,
    subject: `Action needed: payment failed for ${props.tenantName}`,
    html: paymentFailedHtml(props),
    kind: "payment-failed",
  });
}

export async function sendSubscriptionEnded(props: SubscriptionEndedProps) {
  await send({
    to: props.to,
    subject: `${props.tenantName} is now on the Free plan`,
    html: subscriptionEndedHtml(props),
    kind: "subscription-ended",
  });
}

export async function sendLimitWarning(props: LimitWarningProps) {
  await send({
    to: props.to,
    subject: `${props.tenantName} is near its monthly event limit`,
    html: limitWarningHtml(props),
    kind: "limit-warning",
  });
}

export async function sendPasswordResetEmail(props: PasswordResetProps) {
  if (!resend) {
    // Without a mail provider the reset link would be unreachable. Log it so
    // local development still has a way through.
    console.log("[email] RESEND_API_KEY not set - password reset url:", props.resetUrl);
    return;
  }

  await send({
    to: props.to,
    subject: "Reset your password",
    html: passwordResetHtml(props),
    kind: "password-reset",
  });
}

export async function sendEmailVerification(props: EmailVerificationProps) {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set - verification url:", props.verifyUrl);
    return;
  }

  await send({
    to: props.to,
    subject: "Confirm your email address",
    html: emailVerificationHtml(props),
    kind: "email-verification",
  });
}

export async function sendSubmissionConfirmation(
  props: SubmissionConfirmationProps
) {
  await send({
    to: props.to,
    subject: `Event received: ${props.eventTitle}`,
    html: submissionConfirmationHtml(props),
    kind: "submission-confirmation",
  });
}

export async function sendModerationNotice(props: ModerationNoticeProps) {
  const subject =
    props.action === "approved"
      ? `Your event is live: ${props.eventTitle}`
      : `Update on your event: ${props.eventTitle}`;

  await send({
    to: props.to,
    subject,
    html: moderationNoticeHtml(props),
    kind: `moderation-${props.action}`,
  });
}

export async function sendInviteEmail(props: InviteEmailProps) {
  if (!resend) {
    // An invitation is unusable without the link, so surface it locally.
    console.log("[email] RESEND_API_KEY not set - invite url:", props.inviteUrl);
    return;
  }

  await send({
    to: props.to,
    subject: `You're invited to ${props.tenantName}`,
    html: inviteEmailHtml(props),
    kind: "invite",
  });
}

export async function sendAdminNotification(props: AdminNotificationProps) {
  await send({
    to: props.to,
    subject: `New event submission: ${props.eventTitle}`,
    html: adminNotificationHtml(props),
    kind: "admin-notification",
  });
}
