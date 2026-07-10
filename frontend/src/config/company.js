// ============================================================
// frontend/src/config/company.js
// ============================================================
// NEW FILE — Billing Step 3
// Description: Single source of truth for company/brand details
// shown on invoices & receipts. Edit these values to match your
// actual ISP business — everything else picks this up automatically.
// (Step 7 will turn this into an admin-editable settings screen.)
// ============================================================

export const COMPANY_INFO = {
  name: 'NetLink Broadband ISP',
  tagline: 'Reliable Internet, Real Support',
  address: 'House 12, Road 5, Banani, Dhaka 1213, Bangladesh',
  phone: '+880 1XXX-XXXXXX',
  email: 'billing@netlink-isp.com',
  website: 'www.netlink-isp.com',
  // Shown on the receipt footer — update once a real gateway is wired up (Step 6)
  paymentNote: 'Please pay before the due date to avoid service interruption.'
};

// ============================================================
// MANUAL PAYMENT ACCOUNTS (bKash / Nagad / Rocket)
// ============================================================
// NEW — Manual Payment feature
// The numbers customers should "Send Money" to. Update these to
// your real merchant/personal wallet numbers.
export const PAYMENT_ACCOUNTS = {
  bkash: { label: 'bKash', number: '01746958484', type: 'Personal', color: '#E2136E' },
  nagad: { label: 'Nagad', number: '01746958484', type: 'Personal', color: '#F6921E' },
  rocket: { label: 'Rocket', number: '01746958484', type: 'Personal', color: '#8C3494' }
};

export default COMPANY_INFO;