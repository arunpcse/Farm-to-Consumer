import { Link } from 'react-router-dom';
import './About.css';

const PILLARS = [
  {
    icon: '🌾',
    title: 'Direct Farm Discovery',
    text: 'Households and commercial kitchens browse active harvest yields directly by district, taluk, and native village, knowing exactly who grew their food.',
  },
  {
    icon: '📊',
    title: '100% Price Transparency',
    text: 'Every listing features an open price breakdown. Farmers retain over 80% of consumer spend, eliminating predatory middleman commissions.',
  },
  {
    icon: '⏳',
    title: 'Harvest Freshness Assurance',
    text: 'Produce is harvested only when ordered or at peak maturity, reaching doorsteps within 24–48 hours rather than sitting in weeks of cold storage.',
  },
  {
    icon: '♻️',
    title: 'Surplus Produce Rescue',
    text: 'Our dedicated anti-waste clearance channel enables farmers to monetize excess yields at fair flash discounts before spoilage occurs.',
  },
];

const STATS = [
  { value: '150+', label: 'Verified Farms Across Tamil Nadu' },
  { value: '₹18.4L+', label: 'Direct Earnings Paid to Growers' },
  { value: '14,200 kg', label: 'Surplus Produce Rescued from Waste' },
  { value: '< 36 hrs', label: 'Average Farm-to-Table Transit Time' },
];

function About() {
  return (
    <div className="about-page">
      {/* Hero Banner */}
      <section className="about-hero">
        <div className="about-container">
          <span className="about-kicker">Our Mission & Agricultural Vision</span>
          <h1 className="about-title">Rebuilding the Bridge Between Tamil Nadu Farms & Everyday Kitchens</h1>
          <p className="about-subtitle">
            FreshHarvest is a digital marketplace engineered to eliminate predatory middlemen, ensure 
            transparent livable prices for local growers, and deliver peak-fresh farm produce directly to homes and commercial kitchens.
          </p>
          <div className="about-hero-actions">
            <Link to="/products" className="fh-btn-primary">Explore Fresh Produce</Link>
            <Link to="/find-farmers" className="fh-btn-secondary">Meet Local Farmers</Link>
            <Link to="/register" className="about-btn-join">Join as Farmer / Buyer →</Link>
          </div>
        </div>
      </section>

      {/* Impact Stats Banner */}
      <section className="about-stats-section">
        <div className="about-container">
          <div className="about-stats-grid">
            {STATS.map(stat => (
              <div key={stat.label} className="about-stat-card">
                <span className="about-stat-val">{stat.value}</span>
                <span className="about-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The 4 Pillars */}
      <section className="about-pillars-section">
        <div className="about-container">
          <div className="about-section-header">
            <span className="about-subtag">Why FreshHarvest Matters</span>
            <h2>Solving the Structural Flaws in Traditional Agriculture</h2>
            <p>
              Traditional agricultural supply chains trap smallholder farmers in opaque auction pricing while consumers pay high prices for week-old cold-stored produce.
            </p>
          </div>

          <div className="about-pillars-grid">
            {PILLARS.map(item => (
              <article key={item.title} className="about-pillar-card">
                <span className="about-pillar-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Story / Community Section */}
      <section className="about-story-section">
        <div className="about-container about-story-grid">
          <div className="about-story-text">
            <span className="about-subtag">Origin & Growth</span>
            <h2>Born in the Agricultural Heartlands of Tamil Nadu</h2>
            <p>
              Starting in the fertile Cauvery basin and Kongu belt—connecting Erode, Thanjavur, Pollachi, and the Nilgiris—FreshHarvest began with a simple belief: the person who nurtures the soil should earn the primary reward, and the family consuming the crop deserves to know who grew it.
            </p>
            <p>
              Today, FreshHarvest powers daily nutrition for urban households while providing bulk procurement contracts for hostel messes, canteens, and farm-to-table restaurants.
            </p>
            <div className="about-story-highlights">
              <div className="ash-item">
                <strong>🌱 100% Verified Growers</strong>
                <span>Every farmer undergoes agronomic and land verification.</span>
              </div>
              <div className="ash-item">
                <strong>🚚 Direct Hub Logistics</strong>
                <span>Coordinated local delivery partners ensure gentle transit.</span>
              </div>
            </div>
          </div>
          <div className="about-story-card">
            <div className="asc-inner">
              <h3>Empower Your Supply Chain</h3>
              <p>Are you a grower looking for stable pricing, or an institutional buyer seeking reliable daily farm supply?</p>
              <div className="asc-actions">
                <Link to="/register" className="fh-btn-primary">Register Free Today</Link>
                <Link to="/bulk-order" className="fh-btn-secondary">Request Bulk Quote</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
