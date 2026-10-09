import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from django.conf import settings

def send_admin_credentials_email(
    admin_name: str,
    admin_email: str,
    password: str,
    org_name: str,
    org_type: str,
    org_id: str,
    portal_base_url: str = "http://localhost:3000"
) -> bool:
    """
    Sends an official onboarding and credentials email to a newly assigned
    Estate / Institutional Administrator via Gmail SMTP SSL port 465.
    """
    subject = f"🌿 EcoEstate India: You are Appointed as Estate Admin for {org_name}"
    sender_email = getattr(settings, 'EMAIL_HOST_USER', 'chhayakantamaharan@gmail.com')
    sender_password = getattr(settings, 'EMAIL_HOST_PASSWORD', 'miapcthmikywftlt')
    
    login_url = f"{portal_base_url}/login"
    dashboard_url = f"{portal_base_url}/user/{org_id}"

    # Rich HTML Email Body
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EcoEstate India Administrator Appointment</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #04050a;
          color: #f1f5f9;
          margin: 0;
          padding: 24px;
        }}
        .card {{
          max-width: 600px;
          margin: 0 auto;
          background-color: #0b0f19;
          border: 1px solid #1e293b;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.15);
        }}
        .header {{
          background: linear-gradient(135deg, #0f172a, #083344);
          padding: 28px 24px;
          border-bottom: 1px solid #1e293b;
          text-align: center;
        }}
        .logo-title {{
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #38bdf8;
          margin: 0;
        }}
        .badge {{
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background-color: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }}
        .content {{
          padding: 28px 24px;
        }}
        h2 {{
          font-size: 18px;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 12px;
        }}
        p {{
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 8px 0;
        }}
        .highlight-box {{
          background-color: #040814;
          border: 1px solid #164e63;
          border-radius: 12px;
          padding: 18px 20px;
          margin: 20px 0;
        }}
        .cred-item {{
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px dashed #1e293b;
          font-size: 13px;
        }}
        .cred-item:last-child {{
          border-bottom: none;
        }}
        .cred-label {{
          color: #64748b;
          font-weight: 600;
        }}
        .cred-val {{
          color: #38bdf8;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-weight: 700;
        }}
        .btn {{
          display: inline-block;
          background: linear-gradient(135deg, #06b6d4, #0284c7);
          color: #020617 !important;
          text-decoration: none;
          font-weight: 800;
          font-size: 14px;
          padding: 12px 24px;
          border-radius: 10px;
          margin-top: 14px;
          text-align: center;
        }}
        .duties-list {{
          margin: 16px 0;
          padding-left: 20px;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.6;
        }}
        .footer {{
          padding: 18px 24px;
          border-top: 1px solid #1e293b;
          text-align: center;
          font-size: 11px;
          color: #475569;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="logo-title">🌿 EcoEstate India</h1>
          <div class="badge">National Sustainable Estate Intelligence</div>
        </div>
        
        <div class="content">
          <h2>Official Appointment Notice</h2>
          <p>Dear <strong>{admin_name}</strong>,</p>
          <p>
            You have been officially provisioned as the <strong>Estate Administrator (Campus Lead)</strong> for:
          </p>
          
          <div style="background-color: #0e1726; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #06b6d4; margin: 12px 0;">
            <div style="font-size: 16px; font-weight: bold; color: #ffffff;">{org_name}</div>
            <div style="font-size: 12px; color: #22d3ee; margin-top: 2px;">Category: {org_type} Campus</div>
          </div>

          <p>You can now log in to your dedicated institutional dashboard with the verified credentials below:</p>

          <div class="highlight-box">
            <div class="cred-item">
              <span class="cred-label">Login Portal:</span>
              <span class="cred-val">{login_url}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Authorized Email:</span>
              <span class="cred-val">{admin_email}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Temporary Password:</span>
              <span class="cred-val">{password}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Assigned Role:</span>
              <span class="cred-val">ESTATE ADMIN</span>
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="{login_url}" class="btn">🚀 Sign In to Estate Workspace</a>
          </div>

          <h3 style="font-size: 14px; color: #f8fafc; margin-bottom: 6px;">Your Operational Scope:</h3>
          <ul class="duties-list">
            <li><strong>Institutional Staff Management:</strong> Enroll and provision subordinate roles (Estate Manager, Energy Auditor, SCADA Operator, Facility Viewer).</li>
            <li><strong>3D Spatial Mesh:</strong> Calibrate aerial campus blueprints and position IoT sensor points.</li>
            <li><strong>Dual-Channel Telemetry:</strong> Monitor live telemetry streaming via Industrial LAN (Modbus-TCP) and WiFi (ESP32).</li>
            <li><strong>Water & Energy Automation:</strong> Regulate STP pump relays and monitor rooftop solar yields.</li>
            <li><strong>ESG & GRIHA Compliance:</strong> Track carbon reduction milestones towards net-zero.</li>
          </ul>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            <em>Security Notice: This email was automatically generated by the National SuperAdmin. Please keep these credentials confidential.</em>
          </p>
        </div>

        <div class="footer">
          EcoEstate India Platform • Ministry of Environment, Forest and Climate Change & BPUT Smart Campus Initiative
        </div>
      </div>
    </body>
    </html>
    """

    # Plaintext Fallback
    text_content = f"""
    🌿 EcoEstate India - Institutional Administrator Appointment

    Dear {admin_name},

    You have been designated as the Estate Administrator for {org_name} ({org_type}).
    
    Login Portal: {login_url}
    Authorized Email: {admin_email}
    Temporary Password: {password}
    Role: ESTATE ADMIN
    
    Direct Dashboard Link: {dashboard_url}
    
    Please sign in and set up your institutional staff members and campus operational controls.
    
    Regards,
    EcoEstate India Platform
    """

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"EcoEstate India <{sender_email}>"
        msg['To'] = admin_email

        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, [admin_email], msg.as_string())
        server.quit()
        print(f"[EMAIL_DISPATCH_SUCCESS] Credentials email dispatched to {admin_email} for {org_name}")
        return True
    except Exception as e:
        print(f"[EMAIL_DISPATCH_ERROR] Failed to send email to {admin_email}: {e}")
        return False


def send_user_role_assignment_email(
    user_name: str,
    user_email: str,
    assigned_role: str,
    role_label: str,
    organization_name: str = "EcoEstate India Platform",
    password: str = None,
    assigned_by: str = "National SuperAdmin",
    portal_base_url: str = "http://localhost:3000"
) -> bool:
    """
    Sends an official role appointment and credentials email whenever the SuperAdmin
    assigns or updates a user's role, or issues new access via Gmail SMTP SSL port 465.
    """
    subject = f"🌿 EcoEstate India: Role Assignment Update - {role_label} ({organization_name})"
    sender_email = getattr(settings, 'EMAIL_HOST_USER', 'chhayakantamaharan@gmail.com')
    sender_password = getattr(settings, 'EMAIL_HOST_PASSWORD', 'miapcthmikywftlt')

    login_url = f"{portal_base_url}/login"
    login_pwd = password or "estate@2026"

    # Role specific duties
    duties_dict = {
        'SUPERADMIN': [
            "National platform architecture and multi-tenant estate provisioning.",
            "Cross-institutional analytics and compliance governance.",
            "Identity management and staff credential authorizations."
        ],
        'ORG_ADMIN': [
            "Full institutional estate oversight and campus sensor mesh administration.",
            "Assigning subordinate campus staff (Managers, Auditors, Operators).",
            "Predictive maintenance work order dispatch and equipment diagnostics."
        ],
        'ESTATE_MANAGER': [
            "Daily operational maintenance checklists and facility walkthroughs.",
            "Physical sensor health validation and spares procurement.",
            "On-site technician ticket routing and issue resolution."
        ],
        'ENERGY_AUDITOR': [
            "Substation transformer load balancing and power factor optimization.",
            "Rooftop solar yield verification and peak-shaving analytics.",
            "Harmonic distortion (THD) and energy audit reporting."
        ],
        'ORG_OPERATOR': [
            "Industrial LAN (Modbus-TCP) and WiFi telemetry streaming supervision.",
            "Real-time sensor telemetry anomaly triage and alert acknowledgments.",
            "STP pump relay and HVAC chiller control sequence execution."
        ],
        'FACILITY_VIEWER': [
            "Read-only visibility into institutional campus sustainability dashboards.",
            "Environmental quality (CPCB AQI, water conservation) metrics monitoring.",
            "ESG and GRIHA green building compliance audits."
        ]
    }
    duties = duties_dict.get(assigned_role, duties_dict.get('ORG_ADMIN', []))
    duties_html = "".join([f"<li style='margin-bottom: 6px;'>{d}</li>" for d in duties])

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Institutional Role Assignment - EcoEstate India</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #04050a;
          color: #f1f5f9;
          margin: 0;
          padding: 24px;
        }}
        .card {{
          max-width: 600px;
          margin: 0 auto;
          background-color: #0b0f19;
          border: 1px solid #1e293b;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.15);
        }}
        .header {{
          background: linear-gradient(135deg, #0f172a, #0e2a47);
          padding: 28px 24px;
          border-bottom: 1px solid #1e293b;
          text-align: center;
        }}
        .logo-title {{
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #38bdf8;
          margin: 0;
        }}
        .badge {{
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background-color: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }}
        .content {{
          padding: 28px 24px;
        }}
        h2 {{
          font-size: 18px;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 12px;
        }}
        p {{
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 8px 0;
        }}
        .highlight-box {{
          background-color: #040814;
          border: 1px solid #164e63;
          border-radius: 12px;
          padding: 18px 20px;
          margin: 20px 0;
        }}
        .cred-item {{
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
          border-bottom: 1px solid #0f1f33;
          font-size: 13px;
        }}
        .cred-item:last-child {{
          border-bottom: none;
        }}
        .cred-label {{
          color: #64748b;
          font-weight: 600;
        }}
        .cred-val {{
          color: #38bdf8;
          font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }}
        .btn {{
          display: inline-block;
          background: linear-gradient(135deg, #06b6d4, #0284c7);
          color: #020617 !important;
          text-decoration: none;
          font-weight: 800;
          font-size: 14px;
          padding: 12px 28px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
          transition: all 0.2s ease;
        }}
        .footer {{
          background-color: #060913;
          padding: 16px 24px;
          border-top: 1px solid #1e293b;
          text-align: center;
          font-size: 11px;
          color: #475569;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-title">🌿 EcoEstate India</div>
          <div class="badge">Identity & Role Provisioning Notice</div>
        </div>
        
        <div class="content">
          <h2>Official Role & Access Update</h2>
          <p>Dear <strong>{user_name}</strong>,</p>
          <p>
            You have been assigned the institutional role of <strong>{role_label}</strong> for <strong>{organization_name}</strong> by {assigned_by}.
          </p>
          
          <div style="background-color: #0e1726; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #06b6d4; margin: 12px 0;">
            <div style="font-size: 16px; font-weight: bold; color: #ffffff;">{role_label}</div>
            <div style="font-size: 12px; color: #22d3ee; margin-top: 2px;">Assigned Facility: {organization_name}</div>
          </div>

          <p>Below are your verified platform login credentials to access your authorized workspace:</p>

          <div class="highlight-box">
            <div class="cred-item">
              <span class="cred-label">Login Portal:</span>
              <span class="cred-val">{login_url}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Authorized Email:</span>
              <span class="cred-val">{user_email}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Login Password:</span>
              <span class="cred-val">{login_pwd}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Assigned Role:</span>
              <span class="cred-val">{role_label}</span>
            </div>
            <div class="cred-item">
              <span class="cred-label">Facility / Campus:</span>
              <span class="cred-val">{organization_name}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="{login_url}" class="btn">🚀 Sign In to Your Workspace</a>
          </div>

          <h3 style="font-size: 14px; color: #f8fafc; margin-bottom: 6px;">Your Authorized Privileges & Responsibilities:</h3>
          <ul style="padding-left: 20px; font-size: 13px; color: #94a3b8; line-height: 1.6;">
            {duties_html}
          </ul>

          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            <em>Security Notice: This credential notification was authorized by the National SuperAdmin. If you did not request this access, please contact your estate administrator immediately.</em>
          </p>
        </div>

        <div class="footer">
          EcoEstate India Platform • BPUT Smart Campus Initiative & National Sustainable Infrastructure Mesh
        </div>
      </div>
    </body>
    </html>
    """

    text_content = f"""
    🌿 EcoEstate India - Role & Credentials Assignment

    Dear {user_name},

    Your institutional access has been provisioned / updated:
    
    Assigned Role: {role_label}
    Facility: {organization_name}
    
    Login Portal: {login_url}
    Authorized Email: {user_email}
    Login Password: {login_pwd}

    Please sign in to access your authorized estate telemetry and facility tools.

    Authorized by: {assigned_by}
    EcoEstate India Platform
    """

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"EcoEstate India <{sender_email}>"
        msg['To'] = user_email

        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, [user_email], msg.as_string())
        server.quit()
        print(f"[EMAIL_DISPATCH_SUCCESS] Role assignment & credentials email dispatched to {user_email} (Role: {role_label})")
        return True
    except Exception as e:
        print(f"[EMAIL_DISPATCH_ERROR] Failed to send role email to {user_email}: {e}")
        return False


def send_password_reset_email(
    user_name: str,
    user_email: str,
    reset_url: str,
    portal_base_url: str = "http://localhost:3000"
) -> bool:
    """
    Sends an official password reset email containing a secure link to the user's
    verified email address via Gmail SMTP SSL port 465.
    """
    subject = "🔐 EcoEstate India: Reset Your Account Password"
    sender_email = getattr(settings, 'EMAIL_HOST_USER', 'chhayakantamaharan@gmail.com')
    sender_password = getattr(settings, 'EMAIL_HOST_PASSWORD', 'miapcthmikywftlt')

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - EcoEstate India</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #04050a;
          color: #f1f5f9;
          margin: 0;
          padding: 24px;
        }}
        .card {{
          max-width: 580px;
          margin: 0 auto;
          background-color: #0b0f19;
          border: 1px solid #1e293b;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15);
        }}
        .header {{
          background: linear-gradient(135deg, #064e3b, #0f172a);
          padding: 28px 24px;
          border-bottom: 1px solid #1e293b;
          text-align: center;
        }}
        .logo-title {{
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #34d399;
          margin: 0;
        }}
        .badge {{
          display: inline-block;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          background-color: rgba(52, 211, 153, 0.15);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.3);
        }}
        .content {{
          padding: 28px 24px;
        }}
        h2 {{
          font-size: 18px;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 12px;
        }}
        p {{
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
          margin: 8px 0;
        }}
        .highlight-box {{
          background-color: #040814;
          border: 1px solid #065f46;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 20px 0;
        }}
        .btn {{
          display: inline-block;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #020617 !important;
          text-decoration: none;
          font-weight: 800;
          font-size: 14px;
          padding: 14px 32px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
          transition: all 0.2s ease;
        }}
        .footer {{
          background-color: #060913;
          padding: 16px 24px;
          border-top: 1px solid #1e293b;
          text-align: center;
          font-size: 11px;
          color: #475569;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-title">🌿 EcoEstate India</div>
          <div class="badge">Security & Password Recovery</div>
        </div>
        
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello <strong>{user_name}</strong>,</p>
          <p>
            We received a request to reset the password for your account associated with <strong>{user_email}</strong>.
          </p>
          
          <div class="highlight-box">
            <p style="margin: 0; font-size: 13px; color: #a7f3d0;">
              Click the button below to choose a new password. This reset link is valid for <strong>60 minutes</strong>.
            </p>
          </div>

          <div style="text-align: center; margin: 26px 0;">
            <a href="{reset_url}" class="btn">🔑 Reset My Password</a>
          </div>

          <p style="font-size: 12px; color: #64748b; word-break: break-all;">
            If the button doesn't work, copy and paste this link in your browser:<br/>
            <a href="{reset_url}" style="color: #38bdf8;">{reset_url}</a>
          </p>

          <p style="font-size: 12px; color: #ef4444; margin-top: 20px;">
            <em>If you did not request a password reset, please ignore this email. Your existing credentials remain completely safe and active.</em>
          </p>
        </div>

        <div class="footer">
          EcoEstate India Platform • BPUT Smart Campus Initiative & National Sustainable Infrastructure Mesh
        </div>
      </div>
    </body>
    </html>
    """

    text_content = f"""
    🌿 EcoEstate India - Password Reset Request

    Hello {user_name},

    We received a request to reset the password for your account: {user_email}

    Click the link below to set a new password (valid for 60 minutes):
    {reset_url}

    If you did not request this, you can safely ignore this email.

    Regards,
    EcoEstate India Security Team
    """

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"EcoEstate India <{sender_email}>"
        msg['To'] = user_email

        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, [user_email], msg.as_string())
        server.quit()
        print(f"[EMAIL_DISPATCH_SUCCESS] Password reset email dispatched to {user_email}")
        return True
    except Exception as e:
        print(f"[EMAIL_DISPATCH_ERROR] Failed to send password reset email to {user_email}: {e}")
        return False


