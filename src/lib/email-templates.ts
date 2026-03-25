export function postcardEmailTemplate(
  recipientName: string,
  message: string,
  heading: string = "A Message from Rugby Buddy"
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2D5F2D 0%, #3a7a3a 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="font-size: 48px; font-weight: bold; letter-spacing: 4px; margin-bottom: 10px;">RB</div>
        <h1 style="margin: 0; font-size: 28px;">${heading}</h1>
      </div>
      <div style="background: white; padding: 30px; border: 2px solid #D4A843; border-top: none;">
        <p style="font-size: 16px;">Dear ${recipientName},</p>
        <div style="font-size: 15px; line-height: 1.6;">${message}</div>
      </div>
      <div style="background: #D4A843; color: white; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="margin: 0; font-size: 14px;">🏉 Rugby Buddy | www.rugbybuddies.co.uk</p>
      </div>
    </div>
  `;
}

export function blastEmailTemplate(subject: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: #2D5F2D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🏉 Rugby Buddy</h1>
      </div>
      <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #2D5F2D;">${subject}</h2>
        <div style="line-height: 1.6;">${body}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">Rugby Buddy - www.rugbybuddies.co.uk</p>
      </div>
    </div>
  `;
}
