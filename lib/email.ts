/**
 * Email notification service
 * Supports Resend (recommended) or console logging for development
 */

interface AdminBookingEmailData {
  bookingReference: string
  bookingPin: string
  gymName: string
  gymCity: string
  gymCountry: string
  gymOwnerEmail?: string
  gymOwnerName?: string
  packageName?: string
  variantName?: string
  startDate: string
  endDate: string
  duration: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  discipline: string
  experienceLevel: string
  notes?: string
  totalPrice: number
  platformFee: number
  currency: string
  paymentIntentId: string
  paymentStatus: string
  cardLast4?: string
  cardBrand?: string
}

interface UserConfirmationEmailData {
  bookingReference: string
  bookingPin: string
  guestName: string
  guestEmail: string
  gymName: string
  gymCountry: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
  totalPrice: number
  currency: string
  cardLast4?: string
  cardBrand?: string
  paymentDate: string
  mealPlanDetails?: {
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
    meals_per_day?: number
    description?: string
  } | null
  magicLink?: string // Optional magic link for booking access
}

/**
 * Send admin notification email with full booking details
 */
export async function sendAdminBookingEmail(data: AdminBookingEmailData): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL

  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not set. Email notifications will be logged to console only.')
  }

  const emailContent = `
═══════════════════════════════════════════════════════════
🆕 NEW BOOKING REQUEST - ACTION REQUIRED
═══════════════════════════════════════════════════════════

📋 BOOKING DETAILS
───────────────────────────────────────────────────────────
Booking Reference: ${data.bookingReference}
Booking PIN: ${data.bookingPin}
Status: ${data.paymentStatus}

🏋️ GYM INFORMATION
───────────────────────────────────────────────────────────
Gym: ${data.gymName}
Location: ${data.gymCity}, ${data.gymCountry}
Owner: ${data.gymOwnerName || 'N/A'} (${data.gymOwnerEmail || 'N/A'})

📦 PACKAGE & ACCOMMODATION
───────────────────────────────────────────────────────────
Package: ${data.packageName || 'N/A'}
${data.variantName ? `Accommodation: ${data.variantName}` : ''}

📅 DATES & DURATION
───────────────────────────────────────────────────────────
Check-in: ${new Date(data.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Check-out: ${new Date(data.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Duration: ${data.duration} ${data.duration === 1 ? 'day' : 'days'}

👤 GUEST INFORMATION
───────────────────────────────────────────────────────────
Name: ${data.guestName}
Email: ${data.guestEmail}
Phone: ${data.guestPhone || 'Not provided'}

🥊 TRAINING DETAILS
───────────────────────────────────────────────────────────
Discipline: ${data.discipline}
Experience Level: ${data.experienceLevel}
${data.notes ? `Notes: ${data.notes}` : ''}

💰 PAYMENT INFORMATION
───────────────────────────────────────────────────────────
Total Amount: ${data.currency} ${data.totalPrice.toFixed(2)}
Platform Fee (15%): ${data.currency} ${data.platformFee.toFixed(2)}
Gym Payout: ${data.currency} ${(data.totalPrice - data.platformFee).toFixed(2)}

Payment Intent ID: ${data.paymentIntentId}
Payment Status: ${data.paymentStatus}
${data.cardLast4 ? `Card: ${data.cardBrand || 'Card'} •••• ${data.cardLast4}` : 'Card: Not available yet'}

⚠️  ACTION REQUIRED
───────────────────────────────────────────────────────────
1. Review booking details above
2. Contact gym owner: ${data.gymOwnerEmail || 'Email not available'}
3. Confirm availability with gym
4. Once confirmed, capture payment via admin dashboard
5. Update booking status to 'confirmed'

🔗 QUICK ACTIONS
───────────────────────────────────────────────────────────
View in Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin
Capture Payment: POST /api/bookings/${data.bookingReference}/capture
Decline Booking: POST /api/bookings/${data.bookingReference}/decline

═══════════════════════════════════════════════════════════
This is an automated notification from CombatBooking
═══════════════════════════════════════════════════════════
  `.trim()

  // Try to send via Resend HTTP API if configured (no SDK required)
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
          subject: `New Booking Request - ${data.bookingReference}`,
          text: emailContent,
        }),
      })

      if (res.ok) {
        console.log(`✅ Admin email sent to ${adminEmail}`)
        return true
      }

      const errText = await res.text()
      console.error('❌ Resend admin email failed:', res.status, errText)
      // Fall through to console logging
    } catch (error) {
      console.error('❌ Failed to send admin email via Resend:', error)
      // Fall through to console logging
    }
  }

  // Fallback: Log to console (for development)
  console.log('\n' + '='.repeat(60))
  console.log('📧 ADMIN BOOKING NOTIFICATION')
  console.log('='.repeat(60))
  console.log(emailContent)
  console.log('='.repeat(60) + '\n')

  if (adminEmail) {
    console.log(`💡 To receive emails, set up Resend API key or check your email service configuration.`)
    console.log(`   Expected recipient: ${adminEmail}`)
  }

  return true
}

/**
 * Send user confirmation email (Booking.com style)
 */
export async function sendUserConfirmationEmail(data: UserConfirmationEmailData): Promise<boolean> {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const checkInDate = formatDate(data.startDate)
  const checkOutDate = formatDate(data.endDate)
  const paymentDate = formatDate(data.paymentDate)
  
  const duration = Math.floor(
    (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Format meal plan details
  let mealPlanText = 'There is no meal option with this booking.'
  if (data.mealPlanDetails) {
    const meals = []
    if (data.mealPlanDetails.breakfast) meals.push('Breakfast')
    if (data.mealPlanDetails.lunch) meals.push('Lunch')
    if (data.mealPlanDetails.dinner) meals.push('Dinner')
    
    if (meals.length > 0) {
      mealPlanText = meals.join(', ')
      if (data.mealPlanDetails.description) {
        mealPlanText += ` - ${data.mealPlanDetails.description}`
      }
    } else if (data.mealPlanDetails.description) {
      mealPlanText = data.mealPlanDetails.description
    }
  }

  // HTML Email Template (Booking.com style)
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - ${data.bookingReference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%;">
          
          <!-- Banner -->
          <tr>
            <td style="background-color: #e6f2ff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
              <h1 style="margin: 0; color: #003580; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">CombatBooking.com</h1>
              <p style="margin: 8px 0 0 0; color: #003580; font-size: 14px;">Confirmation: ${data.bookingReference}</p>
              <p style="margin: 4px 0 0 0; color: #003580; font-size: 14px;">PIN: ${data.bookingPin} (Confidential)</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 20px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: bold; line-height: 1.3;">
                Thanks ${data.guestName}! Your booking request for ${data.gymName} in ${data.gymCountry} has been received.
              </h2>

              <!-- Important Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; line-height: 1.5; font-weight: 600;">
                  ⚠️ Your card has been authorized but not charged yet
                </p>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                  We're confirming availability with ${data.gymName} for your selected dates. Once the gym confirms your booking, we'll charge your card and send you a confirmation email. You'll only be charged if the gym confirms availability.
                </p>
              </div>

              <!-- Checkmarks -->
              <div style="margin-bottom: 30px;">
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  Your booking request has been received for ${checkInDate}
                </p>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  Your card has been authorized (funds reserved, not charged)
                </p>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #3b82f6; font-size: 18px; margin-right: 8px;">📧</span>
                  You'll receive another email once ${data.gymName} confirms your booking and your card is charged
                </p>
                ${data.magicLink ? `
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <a href="${data.magicLink}" style="color: #006ce4; text-decoration: none;">Make changes to your booking or ask the gym a question in just a few clicks</a>
                </p>
                ` : ''}
                <p style="margin: 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #6b7280; font-size: 18px; margin-right: 8px;">🔒</span>
                  Please keep your PIN confidential as it can be used to modify or cancel your booking.
                </p>
              </div>

              <!-- Reservation Details -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${data.gymName}</h3>
                <h4 style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Reservation details</h4>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Check-in:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${checkInDate} (14:00 - 23:00)</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Check-out:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${checkOutDate} (until 10:00)</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Your reservation:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${duration} ${duration === 1 ? 'night' : 'nights'}${data.packageName ? `, ${data.packageName}` : ''}${data.variantName ? ` - ${data.variantName}` : ''}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Payment Information -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment information</h4>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  Your card has been <strong style="color: #f59e0b;">authorized</strong> for <strong>${data.currency} ${data.totalPrice.toFixed(2)}</strong> but <strong>not charged yet</strong>.
                </p>
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                  Funds have been reserved on your card. You'll only be charged once the gym confirms availability. If the gym cannot accommodate your booking, the authorization will be released and no charge will be made.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #4b5563; font-size: 14px;">${paymentDate}</span>
                      ${data.cardLast4 ? `
                      <span style="color: #4b5563; font-size: 14px; margin-left: 12px;">${data.cardBrand || 'Card'} •••• ${data.cardLast4}</span>
                      ` : ''}
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <span style="color: #f59e0b; font-size: 14px; font-weight: 600;">Authorized</span>
                      <span style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin-left: 8px;">${data.currency} ${data.totalPrice.toFixed(2)}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Guest Details -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${data.packageName || 'Booking Details'}</h4>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Guest name</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${data.guestName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Meal plan</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${mealPlanText}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <h5 style="margin: 0 0 8px 0; color: #1e40af; font-size: 15px; font-weight: 600;">What Happens Next?</h5>
                <p style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 14px; line-height: 1.5;">
                  We're confirming availability with ${data.gymName} for your selected dates. Once they confirm, we'll:
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                  <li>Charge your card for ${data.currency} ${data.totalPrice.toFixed(2)}</li>
                  <li>Send you a confirmation email with all the details</li>
                  <li>Confirm your booking is ready for your arrival</li>
                </ul>
                <p style="margin: 12px 0 0 0; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
                  This usually happens within 24-48 hours. If the gym cannot accommodate your booking, we'll notify you and release the authorization on your card.
                </p>
              </div>

              <!-- Security Warning -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="24" valign="top" style="padding-right: 12px;">
                      <span style="color: #f59e0b; font-size: 18px; font-weight: bold;">ℹ</span>
                    </td>
                    <td>
                      <h5 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">Stay safe online</h5>
                      <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                        Protect your security by never sharing your personal or credit card information over the phone, by email or chat.
                      </p>
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://combatbooking.com'}/privacy" style="color: #f59e0b; text-decoration: none; font-size: 13px; margin-top: 8px; display: inline-block;">Learn more</a>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                If you have any questions, please contact us using your booking reference: <strong>${data.bookingReference}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Plain text fallback
  const textContent = `
CombatBooking.com
Confirmation: ${data.bookingReference}
PIN: ${data.bookingPin} (Confidential)

Thanks ${data.guestName}! Your booking request for ${data.gymName} in ${data.gymCountry} has been received.

⚠️ IMPORTANT: Your card has been authorized but not charged yet
We're confirming availability with ${data.gymName} for your selected dates. Once the gym confirms your booking, we'll charge your card and send you a confirmation email. You'll only be charged if the gym confirms availability.

✓ Your booking request has been received for ${checkInDate}
✓ Your card has been authorized (funds reserved, not charged)
📧 You'll receive another email once ${data.gymName} confirms your booking and your card is charged
${data.magicLink ? `✓ Make changes to your booking: ${data.magicLink}` : ''}
🔒 Please keep your PIN confidential as it can be used to modify or cancel your booking.

${data.gymName}
Reservation details
Check-in: ${checkInDate} (14:00 - 23:00)
Check-out: ${checkOutDate} (until 10:00)
Your reservation: ${duration} ${duration === 1 ? 'night' : 'nights'}${data.packageName ? `, ${data.packageName}` : ''}${data.variantName ? ` - ${data.variantName}` : ''}

Payment information
Your card has been AUTHORIZED for ${data.currency} ${data.totalPrice.toFixed(2)} but NOT CHARGED yet.
Funds have been reserved on your card. You'll only be charged once the gym confirms availability. If the gym cannot accommodate your booking, the authorization will be released and no charge will be made.

${paymentDate}${data.cardLast4 ? ` ${data.cardBrand || 'Card'} •••• ${data.cardLast4}` : ''} - Authorized ${data.currency} ${data.totalPrice.toFixed(2)}

${data.packageName || 'Booking Details'}
Guest name: ${data.guestName}
Meal plan: ${mealPlanText}

What Happens Next?
We're confirming availability with ${data.gymName} for your selected dates. Once they confirm, we'll:
- Charge your card for ${data.currency} ${data.totalPrice.toFixed(2)}
- Send you a confirmation email with all the details
- Confirm your booking is ready for your arrival

This usually happens within 24-48 hours. If the gym cannot accommodate your booking, we'll notify you and release the authorization on your card.

Stay safe online
Protect your security by never sharing your personal or credit card information over the phone, by email or chat.

If you have any questions, please contact us using your booking reference: ${data.bookingReference}

© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
  `.trim()

  // Try to send via Resend HTTP API if configured (no SDK required)
  if (process.env.RESEND_API_KEY) {
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
          to: [data.guestEmail],
          subject: `Booking Request Received - ${data.bookingReference}`,
          html: htmlContent,
          text: textContent,
        }),
      })

      if (res.ok) {
        console.log(`✅ User confirmation email sent to ${data.guestEmail}`)
        return true
      }

      const errText = await res.text()
      console.error('❌ Resend user email failed:', res.status, errText)
      // Fall through to console logging
    } catch (error) {
      console.error('❌ Failed to send user email via Resend:', error)
      // Fall through to console logging
    }
  }

  // Fallback: Log to console
  console.log(`\n📧 USER CONFIRMATION EMAIL (would send to ${data.guestEmail}):`)
  console.log(textContent)
  console.log('\n')

  return true
}

interface BookingConfirmedEmailData {
  bookingReference: string
  bookingPin: string
  guestName: string
  guestEmail: string
  gymName: string
  gymCountry: string
  startDate: string
  endDate: string
  packageName?: string
  variantName?: string
  totalPrice: number
  currency: string
  cardLast4?: string
  cardBrand?: string
  chargeDate: string
  mealPlanDetails?: {
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
    meals_per_day?: number
    description?: string
  } | null
  magicLink?: string
}

/**
 * Send booking confirmed email (after payment is captured)
 * This is sent when the gym/admin confirms availability and payment is charged
 */
export async function sendBookingConfirmedEmail(data: BookingConfirmedEmailData): Promise<boolean> {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const checkInDate = formatDate(data.startDate)
  const checkOutDate = formatDate(data.endDate)
  const chargeDate = formatDate(data.chargeDate)
  
  const duration = Math.floor(
    (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Format meal plan details with all available information
  let mealPlanText = 'There is no meal option with this booking.'
  let mealPlanDetails = ''
  if (data.mealPlanDetails) {
    const meals = []
    if (data.mealPlanDetails.breakfast) meals.push('Breakfast')
    if (data.mealPlanDetails.lunch) meals.push('Lunch')
    if (data.mealPlanDetails.dinner) meals.push('Dinner')
    
    if (meals.length > 0) {
      mealPlanText = meals.join(', ')
      if (data.mealPlanDetails.meals_per_day) {
        mealPlanText += ` (${data.mealPlanDetails.meals_per_day} ${data.mealPlanDetails.meals_per_day === 1 ? 'meal' : 'meals'} per day)`
      }
      if (data.mealPlanDetails.description) {
        mealPlanText += ` - ${data.mealPlanDetails.description}`
      }
    } else if (data.mealPlanDetails.meals_per_day) {
      mealPlanText = `${data.mealPlanDetails.meals_per_day} ${data.mealPlanDetails.meals_per_day === 1 ? 'meal' : 'meals'} per day`
      if (data.mealPlanDetails.description) {
        mealPlanText += ` - ${data.mealPlanDetails.description}`
      }
    } else if (data.mealPlanDetails.description) {
      mealPlanText = data.mealPlanDetails.description
    }

    // Build detailed meal plan info for display
    if (data.mealPlanDetails.meals_per_day || meals.length > 0 || data.mealPlanDetails.description) {
      mealPlanDetails = '<div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb;">'
      if (data.mealPlanDetails.meals_per_day) {
        mealPlanDetails += `<p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;"><strong>Meals per day:</strong> ${data.mealPlanDetails.meals_per_day}</p>`
      }
      if (meals.length > 0) {
        mealPlanDetails += `<p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;"><strong>Meal types included:</strong> ${meals.join(', ')}</p>`
      }
      if (data.mealPlanDetails.description) {
        mealPlanDetails += `<p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Details:</strong> ${data.mealPlanDetails.description}</p>`
      }
      mealPlanDetails += '</div>'
    }
  }

  // HTML Email Template
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - ${data.bookingReference}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%;">
          
          <!-- Banner -->
          <tr>
            <td style="background-color: #e6f2ff; padding: 30px 20px; text-align: center; border-bottom: 1px solid #d1e7ff;">
              <h1 style="margin: 0; color: #003580; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">CombatBooking.com</h1>
              <p style="margin: 8px 0 0 0; color: #003580; font-size: 14px;">Confirmation: ${data.bookingReference}</p>
              <p style="margin: 4px 0 0 0; color: #003580; font-size: 14px;">PIN: ${data.bookingPin} (Confidential)</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 20px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: bold; line-height: 1.3;">
                You're On The Way! Your ${data.gymName} Has Confirmed Your Booking.
              </h2>

              <!-- Reassuring Message -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <strong>Great news!</strong> The gym has confirmed availability for your selected dates. Your booking is now confirmed and your card has been charged.
                </p>
              </div>

              <!-- Checkmarks -->
              <div style="margin-bottom: 30px;">
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  ${data.gymName} is expecting you on ${checkInDate}
                </p>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  Your payment of ${data.currency} ${data.totalPrice.toFixed(2)} has been successfully processed
                </p>
                ${data.magicLink ? `
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #22c55e; font-size: 18px; margin-right: 8px;">✓</span>
                  <a href="${data.magicLink}" style="color: #006ce4; text-decoration: none;">Manage your booking or contact the gym</a>
                </p>
                ` : ''}
                <p style="margin: 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  <span style="color: #6b7280; font-size: 18px; margin-right: 8px;">🔒</span>
                  Please keep your PIN confidential as it can be used to modify or cancel your booking.
                </p>
              </div>

              <!-- Reservation Details -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${data.gymName}</h3>
                <h4 style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Reservation details</h4>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Check-in:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${checkInDate} (14:00 - 23:00)</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Check-out:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${checkOutDate} (until 10:00)</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Your reservation:</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${duration} ${duration === 1 ? 'night' : 'nights'}${data.packageName ? `, ${data.packageName}` : ''}${data.variantName ? ` - ${data.variantName}` : ''}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Payment Information -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Payment information</h4>
                <p style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 15px; line-height: 1.5;">
                  Your card has been charged <strong style="color: #22c55e;">${data.currency} ${data.totalPrice.toFixed(2)}</strong> for this booking.
                </p>
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                  The gym has confirmed availability and your payment has been processed. You should see this charge on your card statement within 1-2 business days.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #4b5563; font-size: 14px;">${chargeDate}</span>
                      ${data.cardLast4 ? `
                      <span style="color: #4b5563; font-size: 14px; margin-left: 12px;">${data.cardBrand || 'Card'} •••• ${data.cardLast4}</span>
                      ` : ''}
                    </td>
                    <td align="right" style="padding: 8px 0;">
                      <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.currency} ${data.totalPrice.toFixed(2)}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Guest Details -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${data.packageName || 'Booking Details'}</h4>
                
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Guest name</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${data.guestName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <strong style="color: #1a1a1a; font-size: 14px;">Meal plan</strong>
                      <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">${mealPlanText}</p>
                      ${mealPlanDetails}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <h5 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 15px; font-weight: 600;">What's Next?</h5>
                <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                  Your booking is confirmed! The gym is expecting you on ${checkInDate}. If you need to make any changes or have questions, you can contact the gym directly or use your booking reference.
                </p>
                ${data.magicLink ? `
                <a href="${data.magicLink}" style="color: #006ce4; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px; display: inline-block;">Manage your booking →</a>
                ` : ''}
              </div>

              <!-- Security Warning -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; margin-bottom: 20px;">
                <h5 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">Stay safe online</h5>
                <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5;">
                  Protect your security by never sharing your personal or credit card information over the phone, by email or chat.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://combatbooking.com'}/privacy" style="color: #006ce4; text-decoration: none; font-size: 13px; margin-top: 8px; display: inline-block;">Learn more</a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                If you have any questions, please contact us using your booking reference: <strong>${data.bookingReference}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  // Plain text fallback
  const textContent = `
CombatBooking.com
Confirmation: ${data.bookingReference}
PIN: ${data.bookingPin} (Confidential)

You're On The Way! Your ${data.gymName} Has Confirmed Your Booking.

Great news! The gym has confirmed availability for your selected dates. Your booking is now confirmed and your card has been charged.

✓ ${data.gymName} is expecting you on ${checkInDate}
✓ Your payment of ${data.currency} ${data.totalPrice.toFixed(2)} has been successfully processed
${data.magicLink ? `✓ Manage your booking: ${data.magicLink}` : ''}
🔒 Please keep your PIN confidential as it can be used to modify or cancel your booking.

${data.gymName}
Reservation details
Check-in: ${checkInDate} (14:00 - 23:00)
Check-out: ${checkOutDate} (until 10:00)
Your reservation: ${duration} ${duration === 1 ? 'night' : 'nights'}${data.packageName ? `, ${data.packageName}` : ''}${data.variantName ? ` - ${data.variantName}` : ''}

Payment information
Your card has been charged ${data.currency} ${data.totalPrice.toFixed(2)} for this booking.
The gym has confirmed availability and your payment has been processed. You should see this charge on your card statement within 1-2 business days.

${chargeDate}${data.cardLast4 ? ` ${data.cardBrand || 'Card'} •••• ${data.cardLast4}` : ''} - Charged ${data.currency} ${data.totalPrice.toFixed(2)}

${data.packageName || 'Booking Details'}
Guest name: ${data.guestName}
Meal plan: ${mealPlanText}

What's Next?
Your booking is confirmed! The gym is expecting you on ${checkInDate}. If you need to make any changes or have questions, you can contact the gym directly or use your booking reference.

Stay safe online
Protect your security by never sharing your personal or credit card information over the phone, by email or chat.

If you have any questions, please contact us using your booking reference: ${data.bookingReference}

© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
  `.trim()

  // Try to send via Resend HTTP API if configured
  if (process.env.RESEND_API_KEY) {
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
          to: [data.guestEmail],
          subject: `Booking Confirmed - ${data.bookingReference}`,
          html: htmlContent,
          text: textContent,
        }),
      })

      if (res.ok) {
        console.log(`✅ Booking confirmed email sent to ${data.guestEmail}`)
        return true
      }

      const errText = await res.text()
      console.error('❌ Resend confirmed email failed:', res.status, errText)
      // Fall through to console logging
    } catch (error) {
      console.error('❌ Failed to send confirmed email via Resend:', error)
      // Fall through to console logging
    }
  }

  // Fallback: Log to console
  console.log(`\n📧 BOOKING CONFIRMED EMAIL (would send to ${data.guestEmail}):`)
  console.log(textContent)
  console.log('\n')

  return true
}

interface BookingRequestAcceptedEmailData {
  bookingReference: string
  guestName: string
  guestEmail: string
  gymName: string
  startDate: string
  endDate: string
  totalPrice: number
  currency: string
  paymentLink: string
}

/**
 * Send email when gym accepts a booking request
 * Transitions: pending → gym_confirmed
 */
export async function sendBookingRequestAcceptedEmail(data: BookingRequestAcceptedEmailData): Promise<boolean> {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const checkInDate = formatDate(data.startDate)
  const checkOutDate = formatDate(data.endDate)

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Request Accepted</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #003580; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">CombatBooking.com</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0;">
    <h2 style="color: #003580; margin-top: 0;">Great news! Your booking request has been accepted</h2>
    <p style="font-size: 18px; font-weight: bold; color: #28a745;">Booking Reference: ${data.bookingReference}</p>
  </div>

  <div style="padding: 20px;">
    <p>Hi ${data.guestName},</p>
    
    <p>Great news! <strong>${data.gymName}</strong> has accepted your booking request.</p>
    
    <div style="background-color: #e7f3ff; border-left: 4px solid #003580; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #003580;">Next Step: Complete Your Payment</h3>
      <p style="margin-bottom: 10px;">To secure your booking, please complete payment within 48 hours:</p>
      <a href="${data.paymentLink}" style="display: inline-block; background-color: #003580; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">Complete Payment</a>
    </div>

    <h3 style="color: #003580;">Booking Details</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Check-in:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${checkInDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Check-out:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${checkOutDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Total Price:</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${data.currency} ${data.totalPrice.toFixed(2)}</strong></td>
      </tr>
    </table>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Important:</strong> Your booking is not confirmed until payment is completed. 
      If payment is not completed within 48 hours, your request may be cancelled.
    </p>

    <p>If you have any questions, please contact us using your booking reference: ${data.bookingReference}</p>

    <p>Best regards,<br>The CombatBooking.com Team</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p>© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const textContent = `
CombatBooking.com
Booking Request Accepted - ${data.bookingReference}

Hi ${data.guestName},

Great news! ${data.gymName} has accepted your booking request.

NEXT STEP: Complete Your Payment
To secure your booking, please complete payment within 48 hours:
${data.paymentLink}

Booking Details:
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Total Price: ${data.currency} ${data.totalPrice.toFixed(2)}

IMPORTANT: Your booking is not confirmed until payment is completed. 
If payment is not completed within 48 hours, your request may be cancelled.

If you have any questions, please contact us using your booking reference: ${data.bookingReference}

Best regards,
The CombatBooking.com Team

© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
  `.trim()

  if (process.env.RESEND_API_KEY) {
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
          to: [data.guestEmail],
          subject: `Booking Request Accepted - ${data.bookingReference}`,
          html: htmlContent,
          text: textContent,
        }),
      })

      if (res.ok) {
        console.log(`✅ Request accepted email sent to ${data.guestEmail}`)
        return true
      }

      const errText = await res.text()
      console.error('❌ Resend request accepted email failed:', res.status, errText)
    } catch (error) {
      console.error('❌ Failed to send request accepted email via Resend:', error)
    }
  }

  console.log(`\n📧 REQUEST ACCEPTED EMAIL (would send to ${data.guestEmail}):`)
  console.log(textContent)
  console.log('\n')

  return true
}

interface BookingRequestDeclinedEmailData {
  bookingReference: string
  guestName: string
  guestEmail: string
  gymName: string
  reason: string
}

/**
 * Send email when gym declines a booking request
 * Transitions: pending → declined
 */
export async function sendBookingRequestDeclinedEmail(data: BookingRequestDeclinedEmailData): Promise<boolean> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Request Declined</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #003580; color: white; padding: 20px; text-align: center;">
    <h1 style="margin: 0;">CombatBooking.com</h1>
  </div>
  
  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
    <h2 style="color: #856404; margin-top: 0;">Booking Request Update</h2>
    <p style="font-size: 18px; font-weight: bold; color: #856404;">Booking Reference: ${data.bookingReference}</p>
  </div>

  <div style="padding: 20px;">
    <p>Hi ${data.guestName},</p>
    
    <p>We're sorry to inform you that <strong>${data.gymName}</strong> is unable to accommodate your booking request at this time.</p>
    
    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>Reason:</strong></p>
      <p style="margin-top: 5px;">${data.reason}</p>
    </div>

    <p>We understand this is disappointing. We encourage you to:</p>
    <ul>
      <li>Browse other available gyms on our platform</li>
      <li>Try different dates if your schedule is flexible</li>
      <li>Contact us if you need assistance finding alternatives</li>
    </ul>

    <p>If you have any questions, please contact us using your booking reference: ${data.bookingReference}</p>

    <p>Best regards,<br>The CombatBooking.com Team</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
    <p>© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()

  const textContent = `
CombatBooking.com
Booking Request Declined - ${data.bookingReference}

Hi ${data.guestName},

We're sorry to inform you that ${data.gymName} is unable to accommodate your booking request at this time.

Reason:
${data.reason}

We understand this is disappointing. We encourage you to:
- Browse other available gyms on our platform
- Try different dates if your schedule is flexible
- Contact us if you need assistance finding alternatives

If you have any questions, please contact us using your booking reference: ${data.bookingReference}

Best regards,
The CombatBooking.com Team

© ${new Date().getFullYear()} CombatBooking.com. All rights reserved.
  `.trim()

  if (process.env.RESEND_API_KEY) {
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
          to: [data.guestEmail],
          subject: `Booking Request Update - ${data.bookingReference}`,
          html: htmlContent,
          text: textContent,
        }),
      })

      if (res.ok) {
        console.log(`✅ Request declined email sent to ${data.guestEmail}`)
        return true
      }

      const errText = await res.text()
      console.error('❌ Resend request declined email failed:', res.status, errText)
    } catch (error) {
      console.error('❌ Failed to send request declined email via Resend:', error)
    }
  }

  console.log(`\n📧 REQUEST DECLINED EMAIL (would send to ${data.guestEmail}):`)
  console.log(textContent)
  console.log('\n')

  return true
}
