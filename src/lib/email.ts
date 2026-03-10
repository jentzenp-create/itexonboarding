import { Resend } from 'resend';
import { MemberSession, BusinessProfile, AdVersion } from '@/types';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}
const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'ITEX Onboarding <noreply@itex.com>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const tradeDirectorEmail = process.env.TRADE_DIRECTOR_EMAIL || 'jentzenp@gmail.com';

export async function sendMagicLinkEmail(session: MemberSession): Promise<void> {
  const magicLink = `${appUrl}/onboarding/${session.token}`;
  
  await getResend().emails.send({
    from: fromEmail,
    to: session.email,
    subject: 'Your ITEX Onboarding Link',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">Welcome to ITEX!</h1>
          <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #8ED400, #00B4E6); margin: 0 auto;"></div>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hello${session.contact_name ? ' ' + session.contact_name : ''},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Click the button below to start your ITEX onboarding journey. This link will take you directly to your personalized onboarding experience.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #8ED400, #00B4E6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Start Your Onboarding
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Or copy and paste this link into your browser:<br>
          <a href="${magicLink}" style="color: #00B4E6; word-break: break-all;">${magicLink}</a>
        </p>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Note:</strong> This link stays active as long as you use it. Each time you access your onboarding, the link automatically renews for another 30 days.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `
  });
}

export async function sendReminderEmail(session: MemberSession): Promise<void> {
  const magicLink = `${appUrl}/onboarding/${session.token}`;
  
  await getResend().emails.send({
    from: fromEmail,
    to: session.email,
    subject: 'Finish Your ITEX Onboarding',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">Don't Miss Out!</h1>
          <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #8ED400, #00B4E6); margin: 0 auto;"></div>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hello${session.contact_name ? ' ' + session.contact_name : ''},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          We noticed you started your ITEX onboarding but haven't completed it yet. It only takes about 10 minutes to finish, and you'll be ready to start trading with thousands of ITEX members!
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(142, 212, 0, 0.1), rgba(0, 180, 230, 0.1)); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Benefits of Completing Your Onboarding:</h3>
          <ul style="color: #4b5563; padding-left: 20px; line-height: 1.8;">
            <li>Get your business listed in the ITEX directory</li>
            <li>AI-generated ad to attract trade partners</li>
            <li>Access to the ITEX mobile app</li>
            <li>Connect with a dedicated Trade Director</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #8ED400, #00B4E6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Complete Your Onboarding
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Your magic link:<br>
          <a href="${magicLink}" style="color: #00B4E6; word-break: break-all;">${magicLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          You're receiving this because you started ITEX onboarding. This is a one-time reminder.
        </p>
      </div>
    `
  });
}

export async function sendMemberCompletionEmail(
  session: MemberSession,
  business: BusinessProfile,
  ad: AdVersion
): Promise<void> {
  const dashboardLink = `${appUrl}/dashboard/${session.token}`;
  const adData = ad.ad_json;
  
  await getResend().emails.send({
    from: fromEmail,
    to: session.email,
    subject: 'Your ITEX Directory Info + Ad Draft',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 10px;">🎉 You're All Set!</h1>
          <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #8ED400, #00B4E6); margin: 0 auto;"></div>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Hello${session.contact_name ? ' ' + session.contact_name : ''},
        </p>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Congratulations! You've completed your ITEX onboarding. Here's your directory information and ad draft:
        </p>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #8ED400;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Business Information</h3>
          <table style="width: 100%; color: #4b5563;">
            <tr><td style="padding: 8px 0; font-weight: 600;">Business Name:</td><td>${business.business_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Contact:</td><td>${business.contact_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Email:</td><td>${business.email || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Phone:</td><td>${business.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Location:</td><td>${business.location || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Website:</td><td>${business.website || 'N/A'}</td></tr>
          </table>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(142, 212, 0, 0.1), rgba(0, 180, 230, 0.1)); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Your AI-Generated Ad</h3>
          <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 12px;">
            <h4 style="color: #8ED400; margin-top: 0;">${adData.headline}</h4>
            <p style="color: #4b5563; font-style: italic;">${adData.short_description}</p>
            <p style="color: #4b5563;">${adData.full_description}</p>
            <div style="margin-top: 12px;">
              <span style="background: #8ED400; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                ${adData.call_to_action}
              </span>
            </div>
            <div style="margin-top: 12px;">
              <p style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Categories:</p>
              <p style="color: #4b5563; font-size: 14px; margin: 0;">${adData.categories.join(', ')}</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" 
             style="display: inline-block; background: linear-gradient(135deg, #8ED400, #00B4E6); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Next Steps:</strong> Your Trade Director will review your information and may reach out to finalize your directory listing. You can update your ad anytime from your dashboard.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Welcome to the ITEX community!
        </p>
      </div>
    `
  });
}

export async function sendTradeDirectorNotification(
  session: MemberSession,
  business: BusinessProfile,
  ad: AdVersion
): Promise<void> {
  const adData = ad.ad_json;
  
  await getResend().emails.send({
    from: fromEmail,
    to: tradeDirectorEmail,
    subject: `New ITEX Member Onboarding Complete: ${business.business_name || 'Unknown Business'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 10px;">New Member Onboarding Complete</h1>
          <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #8ED400, #00B4E6); margin: 0 auto;"></div>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Member Information</h3>
          <table style="width: 100%; color: #4b5563;">
            <tr><td style="padding: 8px 0; font-weight: 600; width: 150px;">Business Name:</td><td>${business.business_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Contact Name:</td><td>${business.contact_name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Email:</td><td><a href="mailto:${session.email}" style="color: #00B4E6;">${session.email}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Phone:</td><td>${business.phone || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Website:</td><td>${business.website ? `<a href="${business.website}" style="color: #00B4E6;">${business.website}</a>` : 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Location:</td><td>${business.location || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Entry Type:</td><td>${session.source}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 600;">Completed At:</td><td>${new Date().toLocaleString()}</td></tr>
          </table>
        </div>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Business Description</h3>
          <p style="color: #4b5563; line-height: 1.6;">${business.description || 'No description provided.'}</p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(142, 212, 0, 0.1), rgba(0, 180, 230, 0.1)); border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #1a1a1a; margin-top: 0;">Selected Ad Version</h3>
          <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 12px;">
            <h4 style="color: #8ED400; margin-top: 0;">${adData.headline}</h4>
            <p style="color: #4b5563; font-style: italic;">${adData.short_description}</p>
            <p style="color: #4b5563;">${adData.full_description}</p>
            <div style="margin-top: 12px;">
              <span style="background: #8ED400; color: white; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                ${adData.call_to_action}
              </span>
            </div>
            <div style="margin-top: 12px;">
              <p style="color: #6b7280; font-size: 12px; margin-bottom: 4px;"><strong>Keywords:</strong> ${adData.keywords.join(', ')}</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;"><strong>Categories:</strong> ${adData.categories.join(', ')}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            <strong>Action Required:</strong> Please review this submission and reach out to the member to finalize their directory listing.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          This is an automated notification from the ITEX Onboarding System.
        </p>
      </div>
    `
  });
}
