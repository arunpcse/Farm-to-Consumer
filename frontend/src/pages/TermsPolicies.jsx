import { useState } from 'react';
import { Link } from 'react-router-dom';
import './TermsPolicies.css';

const TABS = [
  { id: 'fair-trade', label: '🌾 Fair Trade & Pricing Charter' },
  { id: 'terms', label: '📄 Terms of Service' },
  { id: 'privacy', label: '🔒 Privacy Policy' },
  { id: 'refunds', label: '📦 Freshness & Refund Policy' },
];

function TermsPolicies() {
  const [activeTab, setActiveTab] = useState('fair-trade');

  return (
    <div className="terms-policies-page">
      {/* Header */}
      <header className="tp-header">
        <div className="tp-container">
          <span className="tp-kicker">Legal, Governance & Community Trust</span>
          <h1>Terms, Privacy & Marketplace Policies</h1>
          <p>
            FreshHarvest operates on absolute transparency, fair prices for farmers, and uncompromised food freshness for consumers and commercial kitchens.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="tp-container tp-layout">
        {/* Navigation Sidebar */}
        <aside className="tp-sidebar">
          <nav className="tp-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`tp-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="tp-support-box">
            <h4>Have a policy question?</h4>
            <p>Our governance and grower support team is available 6 days a week.</p>
            <Link to="/support" className="tp-support-link">
              Contact FreshHarvest Support →
            </Link>
          </div>
        </aside>

        {/* Policy Document Body */}
        <main className="tp-content">
          {activeTab === 'fair-trade' && (
            <article className="tp-doc">
              <h2>1. Fair Trade & Transparent Pricing Charter</h2>
              <p className="tp-updated">Last revised: October 2026 · FreshHarvest Farmer Alliance</p>

              <div className="tp-highlight-card">
                <h3>Our Core Promise to Farmers & Buyers</h3>
                <p>
                  Unlike traditional wholesale mandi systems where 3 to 5 layers of middlemen siphon up to 55% of the consumer rupee, FreshHarvest operates on a zero-hidden-brokerage principle.
                </p>
              </div>

              <h3>1.1 Direct Farmer Remittance</h3>
              <p>
                Every listing on FreshHarvest reflects the farmer's self-declared base price. Farmers retain at least <strong>80% to 85%</strong> of the gross retail amount paid by consumers. FreshHarvest deducts only a nominal platform maintenance fee (7–10%) to cover server infrastructure, agronomic quality testing, and payment gateway costs.
              </p>

              <h3>1.2 Daily Price Transparency</h3>
              <p>
                Every product detail page explicitly displays a transparent cost breakdown showing the Farmer's direct payout, eco-packaging cost, and local logistics expense.
              </p>

              <h3>1.3 Payment Settlement Speed</h3>
              <p>
                Funds for confirmed deliveries are credited to the verified farmer's registered bank or UPI account within <strong>24 to 48 hours</strong> of customer delivery confirmation, eliminating predatory credit debt cycles.
              </p>
            </article>
          )}

          {activeTab === 'terms' && (
            <article className="tp-doc">
              <h2>2. Marketplace Terms of Service</h2>
              <p className="tp-updated">Effective date: January 2026</p>

              <h3>2.1 Account Roles & Eligibility</h3>
              <p>
                FreshHarvest provides customized experiences for four distinct stakeholder roles:
              </p>
              <ul>
                <li><strong>Individual Consumers:</strong> May purchase produce for personal or household consumption.</li>
                <li><strong>Verified Farmers:</strong> May list harvest yields, declare lot availability, and fulfill direct customer and bulk orders.</li>
                <li><strong>Bulk Buyers & Institutions:</strong> Verified restaurants, hostels, hotels, and canteens who purchase minimum threshold wholesale orders under commercial terms.</li>
                <li><strong>Delivery Partners:</strong> Contracted local logistics drivers responsible for picking up fresh produce from farm gates or hub points and delivering directly to buyers.</li>
              </ul>

              <h3>2.2 Accuracy of Harvest Information</h3>
              <p>
                Farmers are responsible for keeping their harvest dates, farming method certifications, and stock estimates truthful. FreshHarvest field personnel conduct regular spot checks to maintain community integrity.
              </p>

              <h3>2.3 User Conduct</h3>
              <p>
                Users agree not to exploit or scrape platform data, create duplicate deceptive accounts, or engage in price manipulation schemes.
              </p>
            </article>
          )}

          {activeTab === 'privacy' && (
            <article className="tp-doc">
              <h2>3. Privacy & Data Protection Policy</h2>
              <p className="tp-updated">Compliant with the Digital Personal Data Protection (DPDP) Act</p>

              <h3>3.1 Information We Collect</h3>
              <p>
                To provide farm-fresh logistics, FreshHarvest collects:
              </p>
              <ul>
                <li><strong>Profile Details:</strong> Name, verified telephone number, email, and user role.</li>
                <li><strong>Delivery Addresses:</strong> Street address, landmark, taluk, village/town, and postal pin code for routing.</li>
                <li><strong>Farmer Agronomic Records:</strong> Farm geographic location, crop categories, soil/fertilizer test certificates, and bank account for payouts.</li>
              </ul>

              <h3>3.2 Data Protection & Non-Sale Guarantee</h3>
              <div className="tp-highlight-card">
                <p>
                  <strong>We never sell your personal data.</strong> Your personal phone number and delivery location are shared only with the assigned delivery driver during active transit and never publicized or marketed to third parties.
                </p>
              </div>

              <h3>3.3 Security Safeguards</h3>
              <p>
                All account credentials and passwords are encrypted using industry-standard bcrypt hashing. Communications across our REST APIs are strictly encrypted via TLS/HTTPS.
              </p>
            </article>
          )}

          {activeTab === 'refunds' && (
            <article className="tp-doc">
              <h2>4. Freshness Guarantee & Cancellation/Refund Policy</h2>
              <p className="tp-updated">FreshHarvest Farm-to-Fork Quality Standard</p>

              <div className="tp-highlight-card">
                <h3>Our "Farm-Fresh or Instant Credit" Guarantee</h3>
                <p>
                  Because agricultural produce is perishable, we hold our deliveries to the highest quality criteria. If produce is damaged during transit or fails quality inspection upon arrival, we make resolution painless.
                </p>
              </div>

              <h3>4.1 Delivery Inspection & Reporting Window</h3>
              <p>
                Customers are requested to inspect produce upon arrival. If any produce is spoiled, bruised, or does not match the farmer's listing specifications:
              </p>
              <ul>
                <li>Take a quick photograph of the affected item.</li>
                <li>Submit a support ticket or report via your <strong>Orders</strong> page within <strong>6 hours</strong> of delivery.</li>
              </ul>

              <h3>4.2 Resolution & Refund Options</h3>
              <p>
                Our customer support team processes claims within 2 hours:
              </p>
              <ul>
                <li><strong>Instant Wallet Credit:</strong> Credited immediately with zero deduction.</li>
                <li><strong>Bank/UPI Reversal:</strong> Initiated within 24 hours to your original payment method.</li>
                <li><strong>Free Replacement:</strong> Arranged on the next morning delivery route if stock permits.</li>
              </ul>

              <h3>4.3 Order Cancellations</h3>
              <p>
                Orders may be cancelled freely before the farmer packages the harvest batch (status: <em>Processing</em>). Once dispatched with an active delivery partner, cancellations cannot be accepted to prevent agricultural food waste.
              </p>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}

export default TermsPolicies;
