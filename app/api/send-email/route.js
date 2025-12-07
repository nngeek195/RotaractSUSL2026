import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request) {
  try {
    const body = await request.json();

    // Normalize payloads for backward compatibility
    const origin = request.headers.get("origin") || "";
    const to =
      body.to || body.email || body.emails || body.toEmail || body.toEmails;

    const template = body.template || body.type;

    const data = body.data || {
      name: body.fullName,
      reason: body.reason,
      loginUrl: origin ? `${origin}/login` : body.loginUrl,
    };

    const replyTo = body.replyTo;

    if (!to || !template) {
      return NextResponse.json(
        { error: "Missing required fields: to/email and template/type" },
        { status: 400 }
      );
    }

    const toList = Array.isArray(to) ? to : [to];

    // Build subject + template HTML
    let subject = "";
    let htmlContent = "";

    /* ======================================================
       📩  CONTACT US TEMPLATE
       ====================================================== */
    if (template === "contact_us") {
      subject = `New Message: ${data.subject || "General Inquiry"}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
            .header { background-color: #f8f9fa; padding: 20px; border-bottom: 1px solid #eee; }
            .content { padding: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; }
            .value { font-size: 16px; color: #000; }
            .message-box { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 5px; white-space: pre-wrap; }
            .footer { padding: 15px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0; color:#333;">New Contact Message</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${data.name} (<a href="mailto:${data.email}">${data.email}</a>)</div>
              </div>
              
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${data.subject}</div>
              </div>

              <div class="field">
                <div class="label">Message</div>
                <div class="value message-box">${data.message}</div>
              </div>
            </div>
            <div class="footer">
              Sent from Rotaract SUSL Website Contact Form
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (template === "membership_approved") {
      subject = "🎉 Your Rotaract SUSL Membership Has Been Approved!";
      htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background-color: #f5f5f7;
          padding: 0;
          margin: 0;
        }
        .container {
          max-width: 620px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
        }
        .header {
          background-color: #F10086;
          color: white;
          padding: 25px;
          text-align: center;
        }
        .content {
          padding: 30px;
          line-height: 1.7;
        }
        .button {
          display: inline-block;
          padding: 12px 25px;
          background-color: #F10086;
          color: #fff !important;
          text-decoration: none;
          font-weight: bold;
          border-radius: 6px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          color: #777;
          font-size: 12px;
          padding: 20px;
        }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
          <h2>Welcome to Rotaract Club of Sabaragamuwa University of Sri Lanka! </h2>
        </div>

        <div class="content">
          <p>Dear <strong>${data?.name || "Member"}</strong>,</p>

          <p>We are thrilled to inform you that your membership application has been <strong style="color:#F10086;">approved</strong>! 🎉</p>

          <p>You are now officially part of the Rotaract Club of Sabaragamuwa University of Sri Lanka — a community dedicated to leadership, service, and positive change.</p>

          ${
            data?.loginUrl
              ? `<a href="${data.loginUrl}" class="button" style="color:#fff !important;">Login to Your Account</a>`
              : ""
          }

          <p style="margin-top:25px;">
            If you have any questions, feel free to get in touch with us anytime.
          </p>

          <p>Warm regards,<br/><strong>Rotaract Club of SUSL</strong></p>
        </div>

        <div class="footer">
          This is an automated message. Please do not reply.
        </div>
        </div>
      </body>
      </html>
    `;
    } else if (template === "membership_rejected") {
      /* ======================================================
       🩷  MEMBERSHIP APPLICATION STATUS (REDESIGNED)
       ====================================================== */
      subject = "Application Update - Rotaract Club of SUSL";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; padding: 0; margin: 0; line-height: 1.6; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #f3f4f6; }
            .header { background: linear-gradient(to right, #db2777, #e11d48); padding: 32px; text-align: center; }
            .content { padding: 40px 32px; }
            .status-badge { display: inline-block; background-color: #fef2f2; color: #991b1b; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px; border: 1px solid #fee2e2; }
            .reason-box { background-color: #fff1f2; border: 1px solid #ffe4e6; border-radius: 12px; padding: 20px; margin: 24px 0; }
            .reason-title { color: #881337; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.025em; margin-bottom: 8px; }
            .reason-text { color: #be123c; font-size: 16px; margin: 0; }
            .button { display: inline-block; background-color: #111827; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 24px; font-size: 15px; }
            .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: white; margin: 0; font-size: 24px;">Application Status Update</h1>
            </div>
            
            <div class="content">
              <div style="text-align: center;">
                <span class="status-badge">Action Required</span>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 16px;">Dear <strong>${data?.name || "Applicant"}</strong>,</p>
              
              <p style="color: #4b5563; margin-bottom: 0;">Thank you for your interest in joining the Rotaract Club of Sabaragamuwa University of Sri Lanka. We have reviewed your application.</p>

              ${data?.reason ? `
              <div class="reason-box">
                <div class="reason-title">Reason for Return</div>
                <p class="reason-text">${data.reason}</p>
              </div>
              ` : ''}

              <p style="color: #4b5563;">Please address the issue mentioned above and submit a new application. We look forward to welcoming you once these details are corrected.</p>

              <div style="text-align: center;">
                <a href="${origin ? `${origin}/join` : 'https://rotaractsusl.org/join'}" class="button">Submit New Application</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 32px; text-align: center;">
                Have questions or believe this is an error? <br/>
                You can reach out to us via our <a href="${origin ? `${origin}/contact` : 'https://rotaractsusl.org/contact'}" style="color: #db2777; text-decoration: none; font-weight: 600;">Contact Page</a>.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 8px 0;">Rotaract Club of Sabaragamuwa University of Sri Lanka</p>
              <p style="margin: 0;">This text is automated. Please do not reply directly.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (template === "relief_token") {
    /* ======================================================
       🇱🇰  FLOOD RELIEF TOKEN EMAIL  (BLUE)
       ====================================================== */
      subject = "🇱🇰 Your Flood Relief Request Token - Rotaract SUSL";
      htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          background-color: #f5f5f7;
          padding: 0;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .token-box {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .token-label {
          font-size: 14px;
          color: #1e40af;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .token {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }
        .info-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box p {
          margin: 0;
          font-size: 14px;
          color: #92400e;
        }
        .request-details {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #4b5563;
          font-size: 14px;
        }
        .detail-value {
          color: #111827;
          margin-top: 4px;
        }
        .materials-list {
          margin-top: 10px;
        }
        .material-item {
          padding: 5px 0;
          color: #374151;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .footer {
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🇱🇰 Flood Relief Request Submitted</h1>
            <p>Your request has been received successfully</p>
          </div>
          <div class="content">
            <p>Dear ${data.schoolName || "School Administrator"},</p>
            <p style="margin-top: 15px;">
              Thank you for submitting your flood relief material request. We have received your submission and our team will review it shortly.
            </p>

            <div class="token-box">
              <div class="token-label">📌 YOUR TRACKING TOKEN</div>
              <div class="token">${data.token}</div>
            </div>

            <div class="info-box">
              <p><strong>⚠️ Important:</strong> Please save this token. You will need it to track and update your request status.</p>
            </div>

            <h3 style="color: #1e3a8a; margin-top: 30px;">Request Details:</h3>
            <div class="request-details">
              <div class="detail-row">
                <div class="detail-label">School Name</div>
                <div class="detail-value">${data.schoolName}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">District</div>
                <div class="detail-value">${data.district}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Contact Person</div>
                <div class="detail-value">${data.contactPerson}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Contact Number</div>
                <div class="detail-value">${data.contactNumber}</div>
              </div>
              ${
                data.description
                  ? `
              <div class="detail-row">
                <div class="detail-label">Description</div>
                <div class="detail-value">${data.description}</div>
              </div>
              `
                  : ""
              }
              <div class="detail-row">
                <div class="detail-label">Materials Requested</div>
                <div class="materials-list">
                  ${
                    data.items
                      ?.map(
                        (item) =>
                          `<div class="material-item">• ${item.name} - Quantity: ${item.quantity}</div>`
                      )
                      .join("") || ""
                  }
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${
                data.trackUrl || "https://rotaractsusl.org/manage-relief"
              }" class="button">
                Track My Request
              </a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              💙 We are working hard to connect donors with schools in need. You will be notified once your request is assigned to a donor.
            </p>

            <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
              For any questions, please contact us at <a href="mailto:info@rotaractsusl.org" style="color: #2563eb;">info@rotaractsusl.org</a>
            </p>
          </div>
          <div class="footer">
            This is an automated message from Rotaract Club of Sabaragamuwa University of Sri Lanka<br>
            Sri Lanka Flood Relief Campaign 2025
          </div>
        </div>
      </body>
      </html>
      `;
    } else {
      return NextResponse.json(
        { error: "Invalid template/type" },
        { status: 400 }
      );
    }

    // Sending email through Resend
    const from =
      process.env.RESEND_FROM || "Rotaract SUSL <noreply@rotaractsusl.org>";
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: sendData, error } = await resend.emails.send({
      from,
      to: toList,
      reply_to: replyTo,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Email sent successfully",
      id: sendData?.id || null,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
