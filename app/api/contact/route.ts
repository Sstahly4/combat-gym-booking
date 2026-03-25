import { NextRequest, NextResponse } from 'next/server'

/**
 * Contact support endpoint - sends email to admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, bookingReference } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!adminEmail) {
      console.warn('⚠️  ADMIN_EMAIL not set. Contact form submission will be logged to console only.')
    }

    const emailContent = `
═══════════════════════════════════════════════════════════
📧 NEW CONTACT FORM SUBMISSION
═══════════════════════════════════════════════════════════

From: ${name} <${email}>
Subject: ${subject}
${bookingReference ? `Booking Reference: ${bookingReference}` : ''}

───────────────────────────────────────────────────────────
MESSAGE:
───────────────────────────────────────────────────────────
${message}

═══════════════════════════════════════════════════════════
This is a contact form submission from CombatBooking
═══════════════════════════════════════════════════════════
    `.trim()

    // Try to send via Resend HTTP API if configured
    if (process.env.RESEND_API_KEY && adminEmail) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            reply_to: email,
            subject: `Contact Form: ${subject}`,
            text: emailContent,
          }),
        })

        if (res.ok) {
          console.log(`✅ Contact email sent to ${adminEmail}`)
          return NextResponse.json({ success: true, message: 'Your message has been sent successfully!' })
        }

        const errText = await res.text()
        console.error('❌ Resend contact email failed:', res.status, errText)
        // Fall through to console logging
      } catch (error) {
        console.error('❌ Failed to send contact email via Resend:', error)
        // Fall through to console logging
      }
    }

    // Fallback: Log to console (for development)
    console.log('\n' + '='.repeat(60))
    console.log('📧 CONTACT FORM SUBMISSION')
    console.log('='.repeat(60))
    console.log(emailContent)
    console.log('='.repeat(60) + '\n')

    if (adminEmail) {
      console.log(`💡 To receive emails, set up Resend API key or check your email service configuration.`)
      console.log(`   Expected recipient: ${adminEmail}`)
    }

    return NextResponse.json({ success: true, message: 'Your message has been sent successfully!' })
  } catch (error: any) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    )
  }
}
