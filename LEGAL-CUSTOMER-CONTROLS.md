# Ultimate Automotive Works LTD — customer/legal controls

Technical release: **v26.9**  
Review date: **10 September 2026**

This document records the technical controls implemented in the workshop application. It is an operational record, not legal advice and not a substitute for review by a UK solicitor or other appropriately qualified adviser.

## Business identity

- Ultimate Automotive Works LTD
- Company number 14995808
- Registered in England and Wales
- Registered office: 9 Water Fir Drive, Harworth, Doncaster, England, DN11 8ND
- Contact: ultimateautomotiveworksinquiry@gmail.com
- Current application wording records that the company is not VAT registered.

## Customer information and consent

The public quote-request flow separates service-contact acknowledgement from optional marketing consent. It requires the customer to acknowledge the current Privacy Notice before submission and records the privacy/quote-request document versions used at the time.

The quote-approval flow requires a customer name, an actual drawn signature, acceptance of the current Workshop Terms, and acknowledgement of the current Privacy Notice and Cancellation Information. The early-start request for an applicable statutory cancellation period is presented separately and remains optional.

Approval evidence records the quote revision, approved amount, maximum authorised amount, customer name/signature, legal document versions, acknowledgement timestamps, early-start choice, timestamp, a one-way hash of the originating IP where available, and user-agent information. Approval links expire after 30 days. Revised approved quotes preserve the prior approval/legal record and require a fresh approval where the quoted work or price changes.

## Payment and vehicle release

Workshop Terms version **UAW-TERMS-2026-09-10-4** states that, unless a different payment arrangement has been agreed with Ultimate Automotive Works LTD in advance, the vehicle and its keys will not be released until all outstanding sums due on the invoice for the authorised work have been paid in full. The term also expressly preserves statutory rights and the customer's ability to dispute a charge.

The same payment/vehicle-release term is shown prominently on the customer quote-approval screen before acceptance.

## Privacy and data minimisation

Public quote approval deliberately returns only customer-facing job, vehicle, quote and quote-item fields. Internal workshop information such as private job notes, cost prices, supplier/barcode data, approval-token hashes, signature records and internal approval metadata is not included in the public response.

Protected workshop tables use row-level security and service access is mediated through the workshop gateway/session controls. Raw client IP addresses are not stored as approval evidence; where available the backend stores a one-way hash.

## Pricing/VAT control

While Ultimate Automotive Works LTD remains not VAT registered, the quote backend forces the VAT rate to zero regardless of client input. If the VAT status changes, this control and the customer/legal documents must be updated before VAT is charged.

## Current legal-document versions

- Legal record: `UAW-LEGAL-2026-09-10-4`
- Workshop Terms: `UAW-TERMS-2026-09-10-4`
- Privacy Notice: `UAW-PRIVACY-2026-09-10-3`
- Cancellation Information: `UAW-CANCEL-2026-09-10-3`
- Quote request information: `UAW-QUOTE-REQUEST-2026-09-10-3`

Automated production tests cover these customer journeys and legal-version checks. Any future legal-text change should increment the relevant version and update the corresponding backend validation and tests so a stale page cannot silently record acceptance to superseded wording.
