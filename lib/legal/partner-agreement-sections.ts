import type { AgreementSection } from './partner-agreement-types'

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    key: 'preamble',
    heading: '',
    body: [
      {
        type: 'note',
        text: 'IMPORTANT — PLEASE READ THIS AGREEMENT CAREFULLY BEFORE LISTING YOUR GYM ON THE COMBATSTAY PLATFORM.',
      },
      {
        type: 'paragraph',
        text: 'By clicking "I Agree" in the Partner Dashboard, you form a binding legal contract with CombatStay Pty Ltd on the terms set out in this document.',
      },
    ],
  },
  {
    key: 'parties',
    heading: '1.   Parties & Agreement',
    body: [
      {
        type: 'paragraph',
        text: 'This Gym Partner Agreement ("Agreement") is entered into between:',
      },
      {
        type: 'paragraph',
        text:
          'Platform:\n\nCombatStay Pty Ltd (ABN: 33 279 676 778) ("CombatStay", "we", "us", "our"), a company incorporated in Queensland, Australia, operating the online marketplace platform at www.combatstay.com.',
      },
      {
        type: 'paragraph',
        text:
          'Partner / Gym Owner:\n\nThe individual or entity ("Partner", "Gym", "you") who accepts this Agreement during the CombatStay onboarding process.',
      },
      {
        type: 'paragraph',
        text: 'By completing the onboarding process and clicking "I Agree" in the CombatStay Partner Dashboard, you:',
      },
      {
        type: 'bullets',
        items: [
          'confirm that you have read, understood, and agree to be bound by this Agreement in its entirety;',
          'represent that you have the legal authority to bind the entity on whose behalf you are accepting; and',
          "acknowledge that the date, time, and IP address of acceptance are recorded by CombatStay's systems and constitute your valid electronic signature for the purposes of the Electronic Transactions Act 1999 (Cth) and any equivalent Thai legislation.",
        ],
      },
      {
        type: 'note',
        text: 'This Agreement constitutes the entire and exclusive basis on which CombatStay agrees to list your gym and process guest bookings on your behalf.',
      },
    ],
  },
  {
    key: 'definitions',
    heading: '2.   Definitions',
    body: [
      {
        type: 'paragraph',
        text: 'In this Agreement, the following terms have the meanings set out below:',
      },
      {
        type: 'table',
        rows: [
          ['Agreement', 'This Gym Partner Agreement, including any schedules or addenda, as amended from time to time in accordance with clause 18.3.'],
          ['Booking', 'A confirmed reservation made by a Guest through the Platform for a Package at the Gym.'],
          ['Cancellation Policy', 'The cancellation and refund rules applicable to Bookings as set out in clause 5.'],
          ['Chargeback', "A reversal of a Guest payment initiated by the Guest's card issuer or payment network."],
          ['Commission', 'The platform fee charged by CombatStay as described in clause 4.1.'],
          [
            'Confidential Information',
            'Any non-public information disclosed by one party to the other in connection with this Agreement, including but not limited to pricing, business data, Guest data, and platform technical information.',
          ],
          ['Guest', 'Any individual who makes or attempts to make a Booking through the Platform.'],
          ['Gym', 'The combat sports training facility operated by the Partner and listed on the Platform.'],
          [
            'Intellectual Property',
            'All copyright, trademarks, patents, trade secrets, designs, and other proprietary rights, whether registered or unregistered.',
          ],
          [
            'Net Payout',
            'The total Booking value received by CombatStay less the Commission and any amounts withheld or deducted in accordance with this Agreement.',
          ],
          [
            'Package',
            'A training camp package, accommodation bundle, or other service offering listed by the Partner on the Platform.',
          ],
          [
            'Partner Content',
            'Photos, descriptions, logos, trademarks, and all other content uploaded by the Partner to the Platform.',
          ],
          [
            'Platform',
            'The CombatStay online marketplace, including the website at www.combatstay.com, the Partner Dashboard, and associated mobile and API interfaces.',
          ],
          ['Settlement Date', "The date on which CombatStay transfers a Net Payout to the Partner's nominated account."],
          ['Stripe', "Stripe, Inc. and/or Stripe Payments Australia Pty Ltd, CombatStay's payment processing partner."],
        ],
      },
    ],
  },
  {
    key: 'platform',
    heading: '3.   The Platform & Our Services',
    body: [
      {
        type: 'paragraph',
        text:
          'CombatStay operates an online marketplace that connects Guests with combat sports training gyms. In consideration of your compliance with this Agreement, CombatStay agrees to provide you with the following services:',
      },
      {
        type: 'bullets',
        items: [
          'Listing and visibility of your Gym on the Platform, subject to verification and approval;',
          'Guest booking and payment processing on your behalf as the merchant of record;',
          'Access to a Partner Dashboard for managing Bookings, availability, pricing, and Packages;',
          'Guest communications infrastructure and automated Booking confirmation, reminder, and cancellation notification systems;',
          'Display of verified guest reviews and ratings for your Gym;',
          'Periodic reporting of Booking activity and settlement records.',
        ],
      },
      {
        type: 'paragraph',
        text:
          'CombatStay is a booking facilitator and marketplace operator. We are not the operator of your Gym, and we do not employ your staff, control your training environment, or accept liability for the conduct of training activities at your premises.',
      },
      {
        type: 'paragraph',
        text:
          "We reserve the right to modify, suspend, or discontinue any feature of the Platform with reasonable notice. We will not be liable to you for any modification, suspension, or discontinuation of Platform services where we have given 30 days' prior written notice.",
      },
    ],
  },
  {
    key: 'commission',
    heading: '4.   Commission & Payments',
    subsections: [
      {
        key: 'commission_rate',
        heading: '4.1  Platform Commission',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay charges a platform Commission of 15% (fifteen percent) of the total Booking value (being the gross amount paid by the Guest, inclusive of any applicable taxes collected at checkout, but exclusive of Stripe processing fees). The Commission is calculated on each Booking at the time of Booking confirmation.',
          },
          {
            type: 'paragraph',
            text:
              "CombatStay may adjust the Commission rate upon 30 days' written notice to you. The Commission rate applicable to any Booking is the rate in force at the time the Booking is confirmed, not the rate at the time of payout.",
          },
        ],
      },
      {
        key: 'settlement',
        heading: '4.2  Settlement Process',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay operates a platform-first payment model. Guest payments are collected in full by CombatStay at the time of Booking. The following settlement process applies:',
          },
          {
            type: 'bullets',
            items: [
              'CombatStay holds the payment until the applicable Cancellation Policy deadline has passed and the Booking is no longer subject to a full refund entitlement;',
              'Net Payouts (total Booking value less Commission and any permitted deductions) are transferred to your nominated bank account or Stripe connected account on a monthly settlement schedule, or as otherwise agreed in writing;',
              'A settlement statement detailing each Booking included in the payout will be made available to you via the Partner Dashboard or by email on or before the Settlement Date;',
              'CombatStay reserves the right to withhold, defer, or set off any amounts from your Net Payout where a Booking is subject to a dispute, Chargeback, complaint, refund request, or pending investigation under this Agreement.',
            ],
          },
          {
            type: 'note',
            text:
              "During the current early-access period, Commission settlement is handled manually on a schedule agreed between the parties. Automatic deduction via Stripe Connect will be activated in a future platform update. You will receive at least 14 days' written notice before automatic deduction takes effect.",
          },
        ],
      },
      {
        key: 'currency',
        heading: '4.3  Currency & Foreign Exchange',
        body: [
          {
            type: 'paragraph',
            text:
              'Bookings may be processed in multiple currencies (including AUD, USD, EUR, THB). CombatStay will settle Net Payouts in the currency agreed with you at onboarding, which may require currency conversion. Any exchange rate applied will be the prevailing rate used by Stripe at the time of settlement. CombatStay is not liable for exchange rate fluctuations between the Booking date and Settlement Date.',
          },
        ],
      },
      {
        key: 'taxes',
        heading: '4.4  Taxes & GST',
        body: [
          {
            type: 'paragraph',
            text:
              'You are solely responsible for all taxes applicable to income you receive through the Platform, including (without limitation) Thai Value Added Tax (VAT), Thai personal or corporate income tax, and any withholding taxes. CombatStay will provide payout records sufficient for your tax and accounting purposes.',
          },
          {
            type: 'paragraph',
            text:
              'Where Australian Goods and Services Tax (GST) applies to the Commission charged by CombatStay, we will issue a tax invoice to you in accordance with the A New Tax System (Goods and Services Tax) Act 1999 (Cth). The Commission amounts stated in this Agreement are exclusive of GST unless otherwise stated.',
          },
        ],
      },
      {
        key: 'setoff',
        heading: '4.5  Set-Off',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay may set off against any amounts payable to you any amounts you owe to CombatStay, including Commission, Chargeback recoveries, refund reimbursements, or amounts payable under clause 5.3. CombatStay will provide written notice of any set-off at or before the time it is applied.',
          },
        ],
      },
    ],
  },
  {
    key: 'cancellations',
    heading: '5.   Cancellations & Refunds',
    subsections: [
      {
        key: 'cancellation_policy',
        heading: '5.1  Platform Cancellation Policy',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay applies the following default cancellation rules to all Bookings, which are presented to Guests at checkout and form part of the Guest\'s booking contract with CombatStay:',
          },
          {
            type: 'table',
            rows: [
              ['Cancellation Timing', 'Refund to Guest'],
              ['Before cancellation deadline (midnight UTC, N days before check-in)', '100% refund of amount paid'],
              ['After cancellation deadline', '0% refund (full charge applies)'],
            ],
          },
          {
            type: 'paragraph',
            text:
              "The value of N (days before check-in) may be set per Package. The default value applied where no per-Package setting exists is the Flexible policy (as defined in the Platform's cancellation policy documentation). By listing Packages on CombatStay, you accept that these cancellation rules apply to all Bookings processed through the Platform.",
          },
        ],
      },
      {
        key: 'gym_cancellations',
        heading: '5.2  Gym-Initiated Cancellations',
        body: [
          {
            type: 'paragraph',
            text:
              "You may decline a new Booking request within 48 hours of receipt. Once a Booking is confirmed, you may not unilaterally cancel or refuse to honour that Booking without CombatStay's prior written approval.",
          },
          {
            type: 'paragraph',
            text: 'Where CombatStay approves a gym-initiated cancellation of a confirmed Booking:',
          },
          {
            type: 'bullets',
            items: [
              'The Guest will receive a full refund regardless of the cancellation deadline;',
              'CombatStay may charge you an administrative fee to cover Stripe processing costs associated with the refund (not to exceed the Commission originally charged on the Booking);',
              'Repeated gym-initiated cancellations (three or more within any 90-day period) will be treated as a material breach and may result in immediate suspension of your listing.',
            ],
          },
        ],
      },
      {
        key: 'refunds',
        heading: '5.3  Refund Processing',
        body: [
          {
            type: 'paragraph',
            text:
              'Refunds to Guests are issued and managed by CombatStay. CombatStay holds liability to the Guest for all valid refunds. Where a refund is issued to a Guest following a late cancellation by the Guest (i.e., outside the cancellation deadline) due to special circumstances approved by CombatStay at its sole discretion, CombatStay will notify you and the refund amount will not be recovered from your Net Payout. Where a refund is issued due to a gym-initiated cancellation or a breach of your obligations under this Agreement, the refund amount (plus any associated Stripe fees) will be deducted from your forthcoming Net Payout, or invoiced to you if no settlement balance exists.',
          },
        ],
      },
    ],
  },
  {
    key: 'chargebacks',
    heading: '6.   Chargebacks & Disputes',
    body: [
      {
        type: 'paragraph',
        text:
          'CombatStay is the merchant of record for all Guest transactions processed through the Platform. As between CombatStay and the Guest\'s card network, CombatStay bears primary liability for Chargebacks. The following provisions govern the allocation of Chargeback liability as between CombatStay and you:',
      },
      {
        type: 'bullets',
        items: [
          'CombatStay will submit dispute evidence to the card network on your behalf, including the Cancellation Policy snapshot recorded at checkout, Booking confirmation records, and any documentation you provide;',
          'You must provide CombatStay with all reasonably requested supporting documentation (including training attendance records, Guest communications, session photos, and any other evidence of Package delivery) within 5 business days of a written request from CombatStay;',
          'If a Chargeback is upheld against CombatStay in relation to a Booking that was fully or substantially fulfilled by you, CombatStay may recover the full disputed amount plus any associated fees levied by Stripe or the relevant card network from your future Net Payouts. CombatStay will provide written notice of any such recovery before or at the time it is applied;',
          "If a Chargeback arises from circumstances that are solely attributable to CombatStay's platform or payment processing (and not to your delivery of the Package), CombatStay will bear the associated costs and will not seek recovery from you;",
          'CombatStay will notify you of any Chargeback relating to your Gym within 10 business days of becoming aware of it;',
          'You agree that your obligation to repay upheld Chargeback amounts is a binding debt obligation under this Agreement and survives termination.',
        ],
      },
      {
        type: 'note',
        text:
          'Best practice: Maintain thorough records of Guest check-ins, training sessions attended, and any correspondence with Guests. These records are your primary evidence in Chargeback disputes.',
      },
    ],
  },
  {
    key: 'obligations',
    heading: '7.   Partner Obligations',
    subsections: [
      {
        key: 'accuracy',
        heading: '7.1  Listing Accuracy',
        body: [
          {
            type: 'paragraph',
            text:
              'You warrant and represent that your Gym listing and all Package information is accurate, complete, and not misleading at all times. Your obligations include:',
          },
          {
            type: 'bullets',
            items: [
              'Maintaining accurate descriptions of training programs, disciplines, coaches, facilities, and accommodation;',
              'Ensuring all pricing for Packages is current, including seasonal variations and any applicable taxes;',
              'Keeping your availability calendar up to date to prevent double-bookings or the acceptance of Bookings you cannot honour;',
              'Using only photographs that genuinely represent your current facilities, staff, and training environment;',
              "Promptly updating your listing within 5 business days if there is any material change to your Gym's facilities, coaching staff, or services that would affect a Guest's decision to book.",
            ],
          },
          {
            type: 'paragraph',
            text:
              'Failure to maintain listing accuracy that results in Guest complaints, refunds, or Chargebacks may be treated as a breach of this Agreement.',
          },
        ],
      },
      {
        key: 'safety',
        heading: '7.2  Safety & Legal Compliance',
        body: [
          {
            type: 'paragraph',
            text: 'You warrant and represent that:',
          },
          {
            type: 'bullets',
            items: [
              'Your Gym operates in full compliance with all applicable laws and regulations in Thailand, including those relating to business registration, employment, occupational health and safety, and public liability;',
              'All training staff hold appropriate qualifications, certifications, or demonstrated experience for the disciplines they teach;',
              'Your facilities meet reasonable health and safety standards for combat sports training, including appropriate first aid provisions;',
              'You maintain, and will continue to maintain throughout the term of this Agreement, appropriate public liability insurance covering Guests participating in training at your Gym, in amounts sufficient to cover the scope of activities offered;',
              'You will honour all confirmed Bookings in full, including providing all elements of the Package as listed on the Platform.',
            ],
          },
          {
            type: 'paragraph',
            text:
              'You agree to provide CombatStay with evidence of insurance coverage upon request. Failure to maintain adequate insurance is a material breach of this Agreement.',
          },
        ],
      },
      {
        key: 'guest_experience',
        heading: '7.3  Guest Experience Standards',
        body: [
          {
            type: 'paragraph',
            text: 'You agree to:',
          },
          {
            type: 'bullets',
            items: [
              'Respond to all Booking requests and Guest communications within 48 hours;',
              'Treat CombatStay Guests with the same standard of care, hospitality, and professionalism as direct Bookings;',
              'Not solicit or encourage Guests to cancel their CombatStay Booking and re-book directly with you, whether during an active stay or at any time thereafter;',
              'Not offer Guests lower prices, additional services, or other incentives to book directly rather than through the Platform;',
              'Not direct Guests to leave reviews or ratings through any platform other than CombatStay in relation to a CombatStay-originated stay.',
            ],
          },
        ],
      },
      {
        key: 'non_circumvention',
        heading: '7.4  Non-Circumvention',
        body: [
          {
            type: 'paragraph',
            text:
              'You acknowledge that CombatStay invests significantly in marketing, guest acquisition, and platform operations. Accordingly, you agree that during the term of this Agreement and for 12 months following termination:',
          },
          {
            type: 'bullets',
            items: [
              "You will not directly solicit or accept direct bookings from any Guest who first identified your Gym through the CombatStay Platform, without CombatStay's prior written consent;",
              "You will not enter into any arrangement with a third party that is designed to or has the effect of circumventing CombatStay's Commission entitlement in respect of Guests sourced through the Platform.",
            ],
          },
          {
            type: 'paragraph',
            text:
              'A breach of this clause 7.4 entitles CombatStay to claim, as liquidated damages, an amount equal to the Commission that would have been payable had the relevant Booking been processed through the Platform.',
          },
        ],
      },
    ],
  },
  {
    key: 'ip',
    heading: '8.   Intellectual Property',
    subsections: [
      {
        key: 'licence',
        heading: '8.1  Partner Content Licence',
        body: [
          {
            type: 'paragraph',
            text:
              'By uploading Partner Content to your CombatStay listing, you grant CombatStay a non-exclusive, royalty-free, worldwide, sublicensable licence to use, reproduce, display, distribute, and adapt that content for the purpose of operating and promoting the Platform. This includes use in website listings, marketing materials, social media, search engine optimisation, and paid advertising.',
          },
          {
            type: 'paragraph',
            text:
              "You warrant that: (a) you own or have all necessary rights to license the Partner Content; (b) the Partner Content does not infringe the Intellectual Property rights of any third party; and (c) CombatStay's use of the Partner Content as described in this clause will not violate any applicable law or third party rights.",
          },
        ],
      },
      {
        key: 'combatstay_ip',
        heading: '8.2  CombatStay Intellectual Property',
        body: [
          {
            type: 'paragraph',
            text:
              "All Intellectual Property in the Platform, including software, design, trademarks, logos, and content created by CombatStay, remains the exclusive property of CombatStay. Nothing in this Agreement grants you any right, title, or interest in CombatStay's Intellectual Property beyond the limited right to access the Platform for the purposes contemplated by this Agreement.",
          },
        ],
      },
      {
        key: 'feedback',
        heading: '8.3  Feedback',
        body: [
          {
            type: 'paragraph',
            text:
              'If you provide CombatStay with suggestions, feedback, or ideas relating to the Platform ("Feedback"), you grant CombatStay an irrevocable, perpetual, royalty-free licence to use that Feedback without restriction or compensation to you.',
          },
        ],
      },
    ],
  },
  {
    key: 'confidentiality',
    heading: '9.   Confidentiality',
    body: [
      {
        type: 'paragraph',
        text:
          "Each party agrees to keep the other party's Confidential Information strictly confidential and not to disclose it to any third party without prior written consent, except:",
      },
      {
        type: 'bullets',
        items: [
          'to employees, contractors, or advisers who need to know the information for the purposes of this Agreement and are bound by equivalent confidentiality obligations;',
          'as required by law, court order, or regulatory authority (with as much notice as practicable given to the disclosing party); or',
          'to the extent the information is or becomes publicly available through no fault of the receiving party.',
        ],
      },
      {
        type: 'paragraph',
        text: 'This obligation survives termination of this Agreement for a period of three (3) years.',
      },
    ],
  },
  {
    key: 'indemnification',
    heading: '10.  Indemnification',
    body: [
      {
        type: 'paragraph',
        text:
          'You agree to indemnify, defend, and hold harmless CombatStay Pty Ltd, its directors, officers, employees, contractors, and agents from and against any claim, action, demand, loss, liability, damage, cost, or expense (including legal fees on a solicitor-client basis) arising out of or in connection with:',
      },
      {
        type: 'bullets',
        items: [
          'any injury, illness, death, loss, or damage suffered by a Guest at your Gym, or arising from your training activities;',
          'any inaccuracy, misrepresentation, or omission in your Gym listing or Package descriptions;',
          'your breach of any warranty, obligation, or representation under this Agreement;',
          'your violation of any applicable law, regulation, or third-party right;',
          'any claim that Partner Content infringes the Intellectual Property rights of a third party;',
          'any tax liability arising from your income received through the Platform.',
        ],
      },
      {
        type: 'paragraph',
        text:
          "CombatStay will provide you with prompt written notice of any claim for which indemnification is sought and will cooperate reasonably in the defence of that claim. You will not settle any claim that imposes obligations on CombatStay without CombatStay's prior written consent.",
      },
    ],
  },
  {
    key: 'liability',
    heading: '11.  Limitation of Liability',
    subsections: [
      {
        key: 'cap',
        heading: "11.1  Cap on CombatStay's Liability",
        body: [
          {
            type: 'paragraph',
            text:
              "To the maximum extent permitted by applicable law, CombatStay's total aggregate liability to you arising under or in connection with this Agreement (whether in contract, tort including negligence, statute, or otherwise) is limited to the total Commission paid by you to CombatStay in the three (3) calendar months immediately preceding the event giving rise to the claim.",
          },
        ],
      },
      {
        key: 'consequential',
        heading: '11.2  Exclusion of Consequential Loss',
        body: [
          {
            type: 'paragraph',
            text:
              'To the maximum extent permitted by applicable law, CombatStay is not liable to you for any: (a) loss of revenue, profits, or anticipated savings; (b) loss of Bookings or business opportunity; (c) reputational damage; (d) loss of data; or (e) indirect, incidental, special, or consequential loss of any kind, however caused and whether or not CombatStay was advised of the possibility of such loss.',
          },
        ],
      },
      {
        key: 'acl',
        heading: '11.3  Australian Consumer Law',
        body: [
          {
            type: 'paragraph',
            text:
              'Nothing in this Agreement limits or excludes any rights you may have under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) or any equivalent applicable legislation that cannot lawfully be excluded or limited.',
          },
        ],
      },
    ],
  },
  {
    key: 'privacy',
    heading: '12.  Data & Privacy',
    body: [
      {
        type: 'paragraph',
        text:
          "Guest personal data shared with you (including name, contact details, and Booking reference) is shared solely for the purpose of fulfilling confirmed Bookings and complying with your legal obligations. You must not use Guest data for any other purpose, including direct marketing, cross-selling, or sharing with third parties, without the Guest's explicit prior consent.",
      },
      {
        type: 'paragraph',
        text:
          "You must comply with all applicable data protection and privacy laws in your jurisdiction, including (without limitation) the Privacy Act 1988 (Cth) and its Australian Privacy Principles (to the extent applicable), and Thailand's Personal Data Protection Act B.E. 2562 (PDPA).",
      },
      {
        type: 'paragraph',
        text:
          'You must implement reasonable technical and organisational security measures to protect Guest data against unauthorised access, loss, or disclosure. You must notify CombatStay promptly (and in any event within 48 hours) upon becoming aware of any actual or suspected security breach involving Guest data.',
      },
      {
        type: 'paragraph',
        text:
          'Upon termination of this Agreement, you must securely destroy or return all Guest data provided to you by CombatStay, unless retention is required by applicable law.',
      },
    ],
  },
  {
    key: 'force_majeure',
    heading: '13.  Force Majeure',
    body: [
      {
        type: 'paragraph',
        text:
          'Neither party will be in breach of this Agreement or liable for any delay or failure to perform its obligations (other than payment obligations) to the extent that delay or failure is caused by circumstances beyond its reasonable control, including (without limitation): natural disasters, pandemic, epidemic, government-imposed restrictions, acts of terrorism, civil unrest, fire, flood, or failure of third-party telecommunications or utility services ("Force Majeure Event").',
      },
      {
        type: 'paragraph',
        text:
          'A party seeking to rely on this clause must: (a) notify the other party promptly and in writing of the Force Majeure Event; and (b) use all reasonable endeavours to mitigate the effects of the event and resume performance as soon as practicable.',
      },
      {
        type: 'paragraph',
        text:
          "If a Force Majeure Event continues for more than 60 consecutive days, either party may terminate this Agreement on 14 days' written notice without liability to the other, except in respect of obligations that accrued prior to the commencement of the Force Majeure Event.",
      },
    ],
  },
  {
    key: 'platform_rights',
    heading: '14.  Platform Rights',
    subsections: [
      {
        key: 'suspension',
        heading: '14.1  Listing Suspension & Removal',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay reserves the right to suspend, deactivate, or permanently remove your listing at any time in the following circumstances:',
          },
          {
            type: 'bullets',
            items: [
              'You breach any term of this Agreement and, where the breach is remediable, fail to remedy it within 14 days of written notice from CombatStay;',
              'CombatStay receives multiple unresolved Guest complaints about your Gym (being three or more complaints within any 90-day period that are not satisfactorily resolved);',
              'Your listing contains false, misleading, or materially inaccurate information;',
              'You fail to meet any payment or reimbursement obligation to CombatStay within 30 days of it falling due;',
              'CombatStay reasonably determines that continued listing poses a material reputational, legal, or regulatory risk to the Platform or its users;',
              'You cease to operate the Gym or the Gym is closed for any reason for more than 30 consecutive days.',
            ],
          },
          {
            type: 'paragraph',
            text:
              'Where the circumstances permit, CombatStay will provide written notice before taking action under this clause. In cases of immediate risk to Guests or the Platform, CombatStay may act without prior notice and will provide written notification as soon as practicable thereafter.',
          },
        ],
      },
      {
        key: 'platform_changes',
        heading: '14.2  Platform Changes',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay reserves the right to modify the Platform, its features, fee structures, or Commission rates at any time, subject to providing you with reasonable prior written notice as specified in this Agreement. Your continued use of the Platform following the expiry of any notice period constitutes acceptance of the relevant change.',
          },
        ],
      },
    ],
  },
  {
    key: 'termination',
    heading: '15.  Term & Termination',
    subsections: [
      {
        key: 'commencement',
        heading: '15.1  Commencement & Continuing Term',
        body: [
          {
            type: 'paragraph',
            text:
              "This Agreement commences on the date you accept it (as recorded by CombatStay's systems) and continues until terminated in accordance with this clause.",
          },
        ],
      },
      {
        key: 'convenience',
        heading: '15.2  Termination for Convenience',
        body: [
          {
            type: 'paragraph',
            text:
              "Either party may terminate this Agreement at any time by providing 30 days' written notice to the other party. Upon receipt of a notice of termination:",
          },
          {
            type: 'bullets',
            items: [
              'CombatStay will close your listing to new Bookings;',
              'All confirmed Bookings with check-in dates falling within the 30-day notice period or beyond remain valid and must be honoured by you;',
              'Net Payouts for honoured Bookings will be settled in accordance with the normal settlement schedule.',
            ],
          },
        ],
      },
      {
        key: 'immediate',
        heading: '15.3  Immediate Termination',
        body: [
          {
            type: 'paragraph',
            text: 'CombatStay may terminate this Agreement immediately upon written notice if:',
          },
          {
            type: 'bullets',
            items: [
              'You materially breach this Agreement and the breach is not capable of remedy;',
              'You are subject to insolvency, bankruptcy, liquidation, or a similar event;',
              'CombatStay is required to terminate by operation of law or regulatory direction;',
              'You engage in conduct that CombatStay reasonably considers to be fraudulent, dishonest, or likely to cause harm to Guests.',
            ],
          },
        ],
      },
      {
        key: 'effect',
        heading: '15.4  Effect of Termination',
        body: [
          {
            type: 'paragraph',
            text: 'Upon termination for any reason:',
          },
          {
            type: 'bullets',
            items: [
              'All accrued payment obligations (including Commission, Chargeback recoveries, and refund reimbursements) survive and remain enforceable;',
              "CombatStay's Intellectual Property licence granted under clause 8.1 terminates, and CombatStay will cease using your Partner Content in new promotional materials (except where it is not reasonably practicable to remove existing cached or archived content);",
              'Your confidentiality obligations under clause 9, your data obligations under clause 12, and your non-circumvention obligations under clause 7.4 survive in accordance with their terms;',
              'CombatStay will retain records of Booking and payment data for the period required by applicable law.',
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'disputes',
    heading: '16.  Dispute Resolution',
    body: [
      {
        type: 'paragraph',
        text:
          'The parties agree to use reasonable endeavours to resolve any dispute arising under or in connection with this Agreement through good-faith negotiation before initiating any formal legal proceedings.',
      },
      {
        type: 'paragraph',
        text:
          'If a dispute is not resolved within 30 days of one party notifying the other in writing (or such longer period as the parties agree), either party may refer the dispute to mediation administered by the Resolution Institute (or its successor) before initiating court proceedings, unless the matter involves urgent interlocutory relief.',
      },
      {
        type: 'paragraph',
        text:
          'Nothing in this clause prevents either party from seeking urgent injunctive or equitable relief from a court of competent jurisdiction where necessary to protect its rights.',
      },
    ],
  },
  {
    key: 'notices',
    heading: '17.  Notices',
    body: [
      {
        type: 'paragraph',
        text:
          'All notices, requests, and other communications under this Agreement must be in writing and will be deemed delivered:',
      },
      {
        type: 'bullets',
        items: [
          "if sent by email to the addresses below, upon confirmed delivery to the recipient's email server (with read receipt or acknowledgement confirmation); or",
          'if sent by registered post, three (3) business days after posting.',
        ],
      },
      {
        type: 'table',
        rows: [
          ['CombatStay', 'partners@combatstay.com'],
          ['Partner', 'Email address provided during onboarding registration'],
        ],
      },
    ],
  },
  {
    key: 'general',
    heading: '18.  General',
    subsections: [
      {
        key: 'governing_law',
        heading: '18.1  Governing Law & Jurisdiction',
        body: [
          {
            type: 'paragraph',
            text:
              'This Agreement is governed by and construed in accordance with the laws of Queensland, Australia. Subject to clause 16, each party irrevocably submits to the exclusive jurisdiction of the courts of Queensland (and courts of appeal therefrom) to resolve any dispute arising under or in connection with this Agreement.',
          },
        ],
      },
      {
        key: 'entire_agreement',
        heading: '18.2  Entire Agreement',
        body: [
          {
            type: 'paragraph',
            text:
              'This Agreement (together with any schedules, addenda, or written amendments agreed between the parties) constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior discussions, representations, understandings, and agreements, whether oral or written.',
          },
        ],
      },
      {
        key: 'amendments',
        heading: '18.3  Amendments',
        body: [
          {
            type: 'paragraph',
            text:
              'CombatStay may update this Agreement from time to time. We will notify you by email to your registered address or via the Partner Dashboard at least 30 days before any material change takes effect. Continued use of the Platform after the notice period constitutes your acceptance of the updated terms. If you do not accept the updated terms, you must notify CombatStay in writing before the effective date, and we will treat this as a notice of termination for convenience under clause 15.2.',
          },
        ],
      },
      {
        key: 'assignment',
        heading: '18.4  Assignment',
        body: [
          {
            type: 'paragraph',
            text:
              "You may not assign, transfer, or novate your rights or obligations under this Agreement without CombatStay's prior written consent. CombatStay may assign this Agreement to any related body corporate or in connection with a merger, acquisition, or sale of all or substantially all of its assets, provided it gives you 30 days' written notice.",
          },
        ],
      },
      {
        key: 'waiver',
        heading: '18.5  Waiver',
        body: [
          {
            type: 'paragraph',
            text:
              'A failure or delay by either party to exercise any right or remedy under this Agreement does not constitute a waiver of that or any other right or remedy. A waiver is only effective if given in writing.',
          },
        ],
      },
      {
        key: 'severability',
        heading: '18.6  Severability',
        body: [
          {
            type: 'paragraph',
            text:
              'If any provision of this Agreement is found by a court to be invalid, illegal, or unenforceable in any respect, that provision will be modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible. The remaining provisions will continue in full force and effect.',
          },
        ],
      },
      {
        key: 'relationship',
        heading: '18.7  Relationship of Parties',
        body: [
          {
            type: 'paragraph',
            text:
              'The parties are independent contractors. Nothing in this Agreement creates an employment relationship, partnership, joint venture, or agency between CombatStay and the Partner.',
          },
        ],
      },
      {
        key: 'anti_bribery',
        heading: '18.8  Anti-Bribery & Corruption',
        body: [
          {
            type: 'paragraph',
            text:
              'Each party warrants that it will not, in connection with this Agreement, engage in any conduct that constitutes bribery, corruption, or a violation of any applicable anti-corruption or anti-money laundering law, including the Criminal Code Act 1995 (Cth) and applicable Thai legislation.',
          },
        ],
      },
      {
        key: 'language',
        heading: '18.9  Language',
        body: [
          {
            type: 'paragraph',
            text:
              'This Agreement is executed in the English language. In the event of any translation into another language, the English language version prevails in all respects.',
          },
        ],
      },
    ],
  },
  {
    key: 'acceptance',
    heading: '19.  Acceptance & Execution',
    body: [
      {
        type: 'paragraph',
        text: 'This Agreement may be executed:',
      },
      {
        type: 'bullets',
        items: [
          'electronically, by clicking "I Agree" in the CombatStay Partner Dashboard — in which case acceptance is recorded with the date, time, and IP address of the accepting party; or',
          'by wet-ink signature of the authorised signatory of each party on the signature page below.',
        ],
      },
      {
        type: 'paragraph',
        text: 'By executing this Agreement, you confirm that:',
      },
      {
        type: 'bullets',
        items: [
          'you have read and understood this Agreement in full;',
          'you have the authority to bind the Gym and any entity on whose behalf you are signing; and',
          'you agree to all terms and conditions set out in this Agreement.',
        ],
      },
    ],
  },
]
