import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'chhayakantamaharan@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'miapcthmikywftlt';
const PORTAL_URL = 'https://eco-estate-delta.vercel.app';

// Robust Multi-Port Nodemailer Transporter with IPv4 Enforcement
async function sendMailWithFallback(mailOptions: any) {
  // Strategy 1: Gmail Port 587 (STARTTLS, Forced IPv4) - Most widely unblocked across Indian ISPs
  try {
    const transporter587 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      requireTLS: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      family: 4, // Force IPv4 to prevent ENETUNREACH on unroutable IPv6 interfaces
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    } as any);

    const info = await transporter587.sendMail(mailOptions);
    return { success: true, mode: 'SMTP_PORT_587', messageId: info.messageId };
  } catch (err587: any) {
    console.warn('SMTP Port 587 attempt failed, trying Port 465 SSL fallback...', err587?.message || err587);
  }

  // Strategy 2: Gmail Port 465 (SSL, Forced IPv4)
  try {
    const transporter465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      family: 4, // Force IPv4
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    } as any);

    const info = await transporter465.sendMail(mailOptions);
    return { success: true, mode: 'SMTP_PORT_465', messageId: info.messageId };
  } catch (err465: any) {
    console.warn('SMTP Port 465 attempt also failed (outbound SMTP blocked by ISP/Firewall):', err465?.message || err465);
  }

  // Strategy 3: Graceful Log Fallback so onboarding never crashes when ISP blocks SMTP ports
  console.log('📬 [EMAIL DISPATCH RECORDED - LOCAL NETWORK BLOCKS OUTBOUND SMTP]');
  console.log(`To: ${mailOptions.to}`);
  console.log(`Subject: ${mailOptions.subject}`);
  console.log(`Text: ${mailOptions.text}`);

  return {
    success: true,
    mode: 'LOG_DISPATCH',
    warning: 'Outbound SMTP ports blocked by ISP. Credentials logged to server terminal.',
  };
}

export async function POST(req: Request) {
  try {
    const hostHeader = req.headers.get('host') || '';
    const protocol = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1') ? 'http' : 'https';
    const effectivePortalUrl = hostHeader ? `${protocol}://${hostHeader}` : PORTAL_URL;

    const body = await req.json();
    const {
      type = 'ADMIN_CREDENTIALS',
      // For Admin Credentials
      adminName,
      adminEmail,
      password = 'estate@2026',
      orgName,
      orgType = 'Campus',
      orgId = 'org-1',
      // For User Role Assignment
      userName,
      userEmail,
      role = 'ORG_ADMIN',
      roleLabel,
      organizationName,
      assignedBy = 'National SuperAdmin',
    } = body;

    const recipient = type === 'USER_ROLE_ASSIGNMENT' ? userEmail : adminEmail;
    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required.' },
        { status: 400 }
      );
    }

    if (type === 'USER_ROLE_ASSIGNMENT') {
      const cleanRoleLabel = roleLabel || role.replace('_', ' ');
      const cleanOrg = organizationName || 'EcoEstate India Platform';
      const cleanName = userName || 'Estate Member';

      const dutiesMap: Record<string, string[]> = {
        SUPERADMIN: [
          'National platform architecture and multi-tenant estate provisioning.',
          'Cross-institutional analytics and compliance governance.',
          'Identity management and staff credential authorizations.',
        ],
        ORG_ADMIN: [
          'Full institutional estate oversight and campus sensor mesh administration.',
          'Assigning subordinate campus staff (Managers, Auditors, Operators).',
          'Predictive maintenance work order dispatch and equipment diagnostics.',
        ],
        ESTATE_MANAGER: [
          'Daily operational maintenance checklists and facility walkthroughs.',
          'Physical sensor health validation and spares procurement.',
          'On-site technician ticket routing and issue resolution.',
        ],
        ENERGY_AUDITOR: [
          'Substation transformer load balancing and power factor optimization.',
          'Rooftop solar yield verification and peak-shaving analytics.',
          'Harmonic distortion (THD) and energy audit reporting.',
        ],
        ORG_OPERATOR: [
          'Industrial LAN (Modbus-TCP) and WiFi telemetry streaming supervision.',
          'Real-time sensor telemetry anomaly triage and alert acknowledgments.',
          'STP pump relay and HVAC chiller control sequence execution.',
        ],
        FACILITY_VIEWER: [
          'Read-only visibility into institutional campus sustainability dashboards.',
          'Environmental quality (CPCB AQI, water conservation) metrics monitoring.',
          'ESG and GRIHA green building compliance audits.',
        ],
      };

      const duties = dutiesMap[role] || dutiesMap.ORG_ADMIN;
      const dutiesHtml = duties.map((d) => `<li style="margin-bottom:6px;">${d}</li>`).join('');

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>EcoEstate India - Role Assignment</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #04050a; color: #f1f5f9; margin: 0; padding: 24px; }
          .card { max-width: 600px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #0f172a, #0e2a47); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e293b; }
          .logo { font-size: 22px; font-weight: 800; color: #38bdf8; margin: 0; }
          .badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: rgba(6,182,212,0.15); color: #22d3ee; border: 1px solid rgba(6,182,212,0.3); }
          .content { padding: 28px 24px; }
          .box { background: #040814; border: 1px solid #164e63; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
          .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #1e293b; font-size: 13px; }
          .cred-row:last-child { border-bottom: none; }
          .cred-label { color: #64748b; font-weight: 600; }
          .cred-val { color: #38bdf8; font-family: monospace; font-weight: 700; }
          .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4, #0284c7); color: #020617 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="logo">🌿 EcoEstate India</h1>
            <div class="badge">National Sustainable Estate Intelligence</div>
          </div>
          <div class="content">
            <h2 style="color:#fff; margin-top:0;">Official Access & Role Grant</h2>
            <p style="color:#94a3b8; font-size:14px;">Dear <strong>${cleanName}</strong>,</p>
            <p style="color:#94a3b8; font-size:14px;">Your authorized account has been provisioned on the EcoEstate platform for <strong>${cleanOrg}</strong>.</p>
            <div class="box">
              <div class="cred-row"><span class="cred-label">Login URL:</span><span class="cred-val">${PORTAL_URL}/login</span></div>
              <div class="cred-row"><span class="cred-label">Authorized Email:</span><span class="cred-val">${recipient}</span></div>
              <div class="cred-row"><span class="cred-label">Temporary Password:</span><span class="cred-val">${password}</span></div>
              <div class="cred-row"><span class="cred-label">Assigned Role:</span><span class="cred-val">${cleanRoleLabel}</span></div>
              <div class="cred-row"><span class="cred-label">Assigned Estate:</span><span class="cred-val">${cleanOrg}</span></div>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${PORTAL_URL}/login" class="btn">🚀 Sign In to Workspace</a>
            </div>
            <h3 style="font-size:14px; color:#f8fafc;">Authorized Scope:</h3>
            <ul style="padding-left:20px; font-size:13px; color:#94a3b8; line-height:1.6;">${dutiesHtml}</ul>
            <p style="font-size:12px; color:#64748b; margin-top:20px;"><em>Authorized by ${assignedBy}. Please change your password upon initial login.</em></p>
          </div>
        </div>
      </body>
      </html>
      `;

      const mailResult = await sendMailWithFallback({
        from: `"EcoEstate India" <${EMAIL_USER}>`,
        to: recipient,
        subject: `🌿 EcoEstate India: Role Assignment Update - ${cleanRoleLabel} (${cleanOrg})`,
        text: `Dear ${cleanName},\n\nYou have been assigned the role ${cleanRoleLabel} for ${cleanOrg}.\n\nLogin Portal: ${PORTAL_URL}/login\nEmail: ${recipient}\nPassword: ${password}\n\nRegards,\nEcoEstate India`,
        html: htmlContent,
      });

      return NextResponse.json({
        success: true,
        message: mailResult.mode === 'LOG_DISPATCH'
          ? `Credentials generated and logged to console for ${recipient}.`
          : `Official credentials delivered to ${recipient} via Gmail SMTP!`,
        dispatchMode: mailResult.mode,
      });
    }

    // Default: ADMIN_CREDENTIALS for Estate / Facility
    const cleanAdminName = adminName || 'Estate Administrator';
    const cleanOrgName = orgName || 'Sustainable Estate Campus';
    const cleanOrgType = orgType || 'COLLEGE';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EcoEstate India - Estate Administrator Appointment</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #04050a; color: #f1f5f9; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0f172a, #083344); padding: 28px 24px; text-align: center; border-bottom: 1px solid #1e293b; }
        .logo { font-size: 22px; font-weight: 800; color: #38bdf8; margin: 0; }
        .badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: rgba(6,182,212,0.15); color: #22d3ee; border: 1px solid rgba(6,182,212,0.3); }
        .content { padding: 28px 24px; }
        .box { background: #040814; border: 1px solid #164e63; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
        .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #1e293b; font-size: 13px; }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-weight: 600; }
        .cred-val { color: #38bdf8; font-family: monospace; font-weight: 700; }
        .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4, #0284c7); color: #020617 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px; margin-top: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo">🌿 EcoEstate India</h1>
          <div class="badge">National Sustainable Estate Intelligence</div>
        </div>
        <div class="content">
          <h2 style="color:#fff; margin-top:0;">Official Appointment Notice</h2>
          <p style="color:#94a3b8; font-size:14px;">Dear <strong>${cleanAdminName}</strong>,</p>
          <p style="color:#94a3b8; font-size:14px;">You have been officially provisioned as the <strong>Estate Administrator</strong> for:</p>
          <div style="background:#0e1726; padding:12px 16px; border-radius:10px; border-left:4px solid #06b6d4; margin:12px 0;">
            <div style="font-size:16px; font-weight:bold; color:#fff;">${cleanOrgName}</div>
            <div style="font-size:12px; color:#22d3ee; margin-top:2px;">Category: ${cleanOrgType} Campus</div>
          </div>
          <div class="box">
            <div class="cred-row"><span class="cred-label">Login Portal:</span><span class="cred-val">${effectivePortalUrl}/login</span></div>
            <div class="cred-row"><span class="cred-label">Authorized Email:</span><span class="cred-val">${recipient}</span></div>
            <div class="cred-row"><span class="cred-label">Temporary Password:</span><span class="cred-val">${password}</span></div>
            <div class="cred-row"><span class="cred-label">Assigned Role:</span><span class="cred-val">ESTATE ADMIN</span></div>
            <div class="cred-row"><span class="cred-label">Direct Dashboard:</span><span class="cred-val">${effectivePortalUrl}/user/${orgId}</span></div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${effectivePortalUrl}/login" class="btn">🚀 Sign In to Estate Workspace</a>
          </div>
          <h3 style="font-size:14px; color:#f8fafc;">Operational Scope:</h3>
          <ul style="padding-left:20px; font-size:13px; color:#94a3b8; line-height:1.6;">
            <li>Enroll and provision institutional staff members (Managers, Auditors, Operators).</li>
            <li>Calibrate campus 3D mesh blueprints and IoT sensor telemetry streams.</li>
            <li>Monitor continuous water consumption, STP recycling, and rooftop solar yield.</li>
            <li>Execute AI Condition-Based Monitoring (CBM) and equipment maintenance.</li>
          </ul>
          <p style="font-size:12px; color:#64748b; margin-top:20px;"><em>Security Notice: This email was automatically generated by the National SuperAdmin.</em></p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailResult = await sendMailWithFallback({
      from: `"EcoEstate India" <${EMAIL_USER}>`,
      to: recipient,
      subject: `🌿 EcoEstate India: You are Appointed as Estate Admin for ${cleanOrgName}`,
      text: `Dear ${cleanAdminName},\n\nYou have been appointed as Estate Administrator for ${cleanOrgName} (${cleanOrgType}).\n\nLogin Portal: ${effectivePortalUrl}/login\nEmail: ${recipient}\nPassword: ${password}\n\nRegards,\nEcoEstate India`,
      html: htmlContent,
    });

    return NextResponse.json({
      success: true,
      message: mailResult.mode === 'LOG_DISPATCH'
        ? `Credentials generated and logged to console for ${recipient}.`
        : `Onboarding credentials successfully delivered to ${recipient} via Gmail SMTP!`,
      dispatchMode: mailResult.mode,
    });
  } catch (err: any) {
    console.error('Email dispatch error in /api/send-email:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
