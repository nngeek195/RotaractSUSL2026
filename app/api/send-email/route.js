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
       🩷  MEMBERSHIP APPROVED TEMPLATE  (ROTARACT PINK)
       ====================================================== */
    if (template === "membership_approved") {
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
       🩷  MEMBERSHIP REJECTED TEMPLATE
       ====================================================== */
      subject = "Rotaract SUSL — Membership Application Update";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f5f5f7;
              color: #333;
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
            .reason-box {
              background: #fff2fa;
              border-left: 4px solid #F10086;
              padding: 12px 15px;
              margin: 15px 0;
              border-radius: 6px;
              color: #d1006f;
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
              <h2>Membership Application Update</h2>
            </div>

            <div class="content">
              <p>Dear <strong>${data?.name || "Applicant"}</strong>,</p>

              <p>Thank you for your interest in joining the Rotaract Club of Sabaragamuwa University of Sri Lanka.</p>

              <p>After reviewing your application, we regret to inform you that your membership cannot be approved at this moment.</p>

              ${
                data?.reason
                  ? `<div class="reason-box"><strong>Reason:</strong> ${data.reason}</div>`
                  : ""
              }

              <p>You are welcome to reapply in the future or contact us for further clarification if needed.</p>

              <p>Best regards,<br/><strong>Rotaract Club of SUSL</strong></p>
            </div>

            <div class="footer">
              This is an automated message. Please do not reply.
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
