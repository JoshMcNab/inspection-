# Ultimate Automotive Works LTD — customer/legal controls

Technical release: **v26.9 security hardening**  
Review date: **11 September 2026**

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

## Database-enforced consent ledger

The database independently enforces the current legal-document versions as well as the browser and Edge Function checks. A new quote request cannot be inserted unless service contact is acknowledged and the current Privacy Notice and quote-request versions are supplied. A quote cannot move into `approved` status unless the current legal, terms, privacy and cancellation versions are present together with the required acknowledgement timestamps, customer name and recorded signature. Expired approval links are rejected.

Each successful quote request writes separate consent-event records for service contact, privacy acknowledgement and the customer's marketing choice. Each successful quote approval writes separate records for Workshop Terms acceptance, Privacy Notice acknowledgement, Cancellation Information acknowledgement, the early-start choice, quote authorisation, signature confirmation and the final quote decision. These records are held in the protected `customer_consents` table in addition to the legal fields stored against the quote/request and the normal audit event.

This database layer means a stale or modified browser page cannot silently bypass the legal-version and signature requirements simply by calling the backend directly.

## Payment and vehicle release

Workshop Terms version **UAW-TERMS-2026-09-10-4** states that, unless a different payment arrangement has been agreed with Ultimate Automotive Works LTD in advance, the vehicle and its keys will not be released until all outstanding sums due on the invoice for the authorised work have been paid in full. The term also expressly preserves statutory rights and the customer's ability to dispute a charge.

The same payment/vehicle-release term is shown prominently on the customer quote-approval screen before acceptance.

## Privacy and data minimisation

Public quote approval deliberately returns only customer-facing job, vehicle, quote and quote-item fields. Internal workshop information such as private job notes, cost prices, supplier/barcode data, approval-token hashes, signature records and internal approval metadata is not included in the public response.

Protected workshop tables use row-level security and service access is mediated through the workshop gateway/session controls. Raw client IP addresses are not stored as approval evidence; where available the backend stores a one-way hash.

## Pricing/VAT control

While Ultimate Automotive Works LTD remains not VAT registered, the quote backend forces the VAT rate to zero regardless of client input. If the VAT status changes, this control and the customer/legal documents must be updated before VAT is charged.

## Production security and testing controls

The legacy quote/authentication actions formerly exposed by `workshop-inspections` are retired. Quote creation, approval-link generation and customer approval must use the current quote service, which enforces approval expiry, single-decision state, signature requirements and the current legal-document versions. The inspection service now requires a valid workshop session for workshop data and explicitly refuses the retired legacy quote/login actions.

Production automated testing is **read-only**. The production self-test control accepts only a health check and cannot provision synthetic staff, create customer/job/quote records, approve quotes or delete cleanup records. The production GitHub workflow runs smoke/access-control tests only. State-changing end-to-end testing must be carried out against an isolated staging/test database rather than live customer data.

The previous production mutation/cleanup mechanism, which could select synthetic records by editable customer-name markers and follow linked records for deletion, has been disabled and its production test/cleanup scripts removed.

## Current legal-document versions

- Legal record: `UAW-LEGAL-2026-09-10-4`
- Workshop Terms: `UAW-TERMS-2026-09-10-4`
- Privacy Notice: `UAW-PRIVACY-2026-09-10-3`
- Cancellation Information: `UAW-CANCEL-2026-09-10-3`
- Quote request information: `UAW-QUOTE-REQUEST-2026-09-10-3`

Production tests verify public pages, company disclosures, legal documents, protected-route denial, retired legacy-route denial, invalid customer-token handling and read-only backend health. Any future legal-text change should increment the relevant version and update the corresponding backend validation and tests so a stale page cannot silently record acceptance to superseded wording.
