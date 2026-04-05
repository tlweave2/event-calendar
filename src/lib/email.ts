import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
      <p><a href="${inviteUrl}" style="color:#2563eb">Accept invitation -></a></p>
      <p style="font-size:14px;color:#555">If you did not expect this invitation, you can ignore this email.</p>
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

export async function sendSubmissionConfirmation(
  props: SubmissionConfirmationProps
) {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set - skipping submission confirmation");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `Event received: ${props.eventTitle}`,
    html: submissionConfirmationHtml(props),
  });
}

export async function sendModerationNotice(props: ModerationNoticeProps) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY not set - skipping ${props.action} notice`);
    return;
  }

  const subject =
    props.action === "approved"
      ? `Your event is live: ${props.eventTitle}`
      : `Update on your event: ${props.eventTitle}`;

  await resend.emails.send({
    from: FROM,
    to: props.to,
    subject,
    html: moderationNoticeHtml(props),
  });
}

export async function sendInviteEmail(props: InviteEmailProps) {
  console.log("[email] invite url:", props.inviteUrl);

  if (!resend) {
    console.log("[email] RESEND_API_KEY not set - skipping invite email");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `You're invited to ${props.tenantName}`,
    html: inviteEmailHtml(props),
  });
}

export async function sendAdminNotification(props: AdminNotificationProps) {
  if (!resend) {
    console.log("[email] RESEND_API_KEY not set - skipping admin notification");
    return;
  }

  await resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `New event submission: ${props.eventTitle}`,
    html: adminNotificationHtml(props),
  });
}