import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ReportsAnalytics.css';

const TIME_RANGES = ['Last 7 Days', 'Last 30 Days', 'This Quarter', 'Financial Year 2026'];

const REGIONS = ['All Tamil Nadu', 'Erode & Kongu Belt', 'Coimbatore Agro Cluster', 'Thanjavur Cauvery Delta', 'Nilgiris Highlands'];

const CATEGORY_DATA = [
  { name: 'Vegetables', share: 38, revenue: 944528, volume: '24,800 kg', color: '#244C3A' },
  { name: 'Fruits & Berries', share: 27, revenue: 671112, volume: '16,200 kg', color: '#3B7A57' },
  { name: 'Grains & Traditional Pulses', share: 21, revenue: 521976, volume: '11,400 kg', color: '#B56E43' },
  { name: 'Dairy & Organic Byproducts', share: 14, revenue: 347984, volume: '7,600 litres', color: '#68785B' },
];

const MONTHLY_TREND = [
  { month: 'May', gmv: 310000, farmerPayout: 254200, orders: 240, surplusRescued: 1800 },
  { month: 'Jun', gmv: 365000, farmerPayout: 299300, orders: 285, surplusRescued: 2150 },
  { month: 'Jul', gmv: 420000, farmerPayout: 344400, orders: 320, surplusRescued: 2600 },
  { month: 'Aug', gmv: 495000, farmerPayout: 405900, orders: 390, surplusRescued: 3100 },
  { month: 'Sep', gmv: 580000, farmerPayout: 475600, orders: 460, surplusRescued: 3850 },
  { month: 'Oct', gmv: 685000, farmerPayout: 561700, orders: 540, surplusRescued: 4400 },
];

const TOP_FARMERS = [
  {
    id: 'f1',
    name: 'Ramasamy Farms',
    farmer: 'Murugan R.',
    location: 'Perundurai, Erode',
    produce: 'Tomatoes, Onions, Spinach',
    orders: 342,
    payout: '₹3,48,200',
    share: '83.2%',
    rating: 4.9,
    status: 'Verified Gold'
  },
  {
    id: 'f2',
    name: 'Kaveri Valley Orchards',
    farmer: 'Lakshmi P.',
    location: 'Pollachi, Coimbatore',
    produce: 'Bananas, Tender Coconut',
    orders: 289,
    payout: '₹2,94,800',
    share: '82.5%',
    rating: 4.8,
    status: 'Verified Gold'
  },
  {
    id: 'f3',
    name: 'Thirunavukkarasu Naturals',
    farmer: 'Rajan K.',
    location: 'Kumbakonam, Thanjavur',
    produce: 'Ponni Rice, Basmati, Millets',
    orders: 215,
    payout: '₹2,42,100',
    share: '84.0%',
    rating: 4.9,
    status: 'Verified Organic'
  },
  {
    id: 'f4',
    name: 'Kangayam Indigenous Dairy',
    farmer: 'Prabhakaran M.',
    location: 'Avinashi, Tiruppur',
    produce: 'Pure A2 Cow Milk, Ghee, Butter',
    orders: 198,
    payout: '₹2,18,500',
    share: '82.0%',
    rating: 5.0,
    status: 'Verified Dairy'
  },
  {
    id: 'f5',
    name: 'Highland Organic Growers',
    farmer: 'Selvam V.',
    location: 'Kotagiri, Nilgiris',
    produce: 'Ooty Carrots, Honey, Spices',
    orders: 164,
    payout: '₹1,84,300',
    share: '83.0%',
    rating: 4.8,
    status: 'Verified Hill'
  }
];

export default function ReportsAnalytics() {
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [selectedRegion, setSelectedRegion] = useState('All Tamil Nadu');
  const [activeTab, setActiveTab] = useState('financial');
  const [exportNotice, setExportNotice] = useState('');

  function handleExport(format) {
    setExportNotice(`Preparing comprehensive ${format.toUpperCase()} executive report... Download started!`);
    setTimeout(() => setExportNotice(''), 4000);
  }

  const maxGmv = Math.max(...MONTHLY_TREND.map(m => m.gmv));

  return (
    <div className="reports-page">
      {/* Top Breadcrumb & Executive Bar */}
      <div className="rep-topbar">
        <div className="rep-container rep-topbar-inner">
          <div className="rep-breadcrumbs">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/admin">Operations</Link>
            <span>/</span>
            <span className="rep-bc-active">Reports & Analytics (Module 27)</span>
          </div>
          <div className="rep-badge-live">
            <span className="rep-pulse-dot" />
            Live Marketplace Telemetry · Updated 2 mins ago
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="rep-container">
        {/* Header with Title and Global Filter Controls */}
        <header className="rep-header">
          <div className="rep-header-title">
            <span className="rep-kicker">FreshHarvest Intelligence & Governance</span>
            <h1>Marketplace Performance & Economics</h1>
            <p className="rep-subtitle">
              Comprehensive analytics on Gross Marketplace Value, direct farmer remittance compliance, harvest volumes, and agricultural food waste reduction.
            </p>
          </div>

          <div className="rep-controls">
            <div className="rep-filter-group">
              <label htmlFor="time-range-select">Time Horizon</label>
              <select
                id="time-range-select"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
              >
                {TIME_RANGES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="rep-filter-group">
              <label htmlFor="region-select">Agricultural Cluster</label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="rep-export-buttons">
              <button
                type="button"
                className="rep-btn-export rep-btn-csv"
                onClick={() => handleExport('csv')}
              >
                📥 Export CSV
              </button>
              <button
                type="button"
                className="rep-btn-export rep-btn-pdf"
                onClick={() => handleExport('pdf')}
              >
                📊 Download PDF
              </button>
            </div>
          </div>
        </header>

        {exportNotice && (
          <div className="rep-export-banner">
            <span>✓ {exportNotice}</span>
          </div>
        )}

        {/* 6 Executive KPI Metric Cards */}
        <section className="rep-kpis-grid">
          <div className="rep-kpi-card">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Gross Marketplace Value</span>
              <span className="rep-kpi-delta rep-delta-up">+18.4%</span>
            </div>
            <div className="rep-kpi-num">₹24,85,600</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">Direct B2C & B2B farm trade</span>
              <span className="rep-spark-bar" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="rep-kpi-card rep-card-highlight">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Direct Farmer Payout</span>
              <span className="rep-kpi-badge">82.0% Share</span>
            </div>
            <div className="rep-kpi-num">₹20,38,190</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">Transferred within 48h to growers</span>
              <span className="rep-spark-bar rep-bar-green" style={{ width: '82%' }} />
            </div>
          </div>

          <div className="rep-kpi-card">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Completed Harvest Orders</span>
              <span className="rep-kpi-delta rep-delta-up">+12.8%</span>
            </div>
            <div className="rep-kpi-num">1,842</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">Average fulfillment: 22 hrs</span>
              <span className="rep-spark-bar" style={{ width: '74%' }} />
            </div>
          </div>

          <div className="rep-kpi-card">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Produce Rescued from Waste</span>
              <span className="rep-kpi-badge rep-badge-orange">Zero-Waste Flash</span>
            </div>
            <div className="rep-kpi-num">14,280 kg</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">₹4.12L extra grower revenue</span>
              <span className="rep-spark-bar rep-bar-orange" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="rep-kpi-card">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Average Basket Size</span>
              <span className="rep-kpi-delta rep-delta-up">+5.2%</span>
            </div>
            <div className="rep-kpi-num">₹1,349</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">Consumer avg: ₹580 · B2B: ₹7,850</span>
              <span className="rep-spark-bar" style={{ width: '60%' }} />
            </div>
          </div>

          <div className="rep-kpi-card">
            <div className="rep-kpi-header">
              <span className="rep-kpi-tag">Delivery On-Time SLA</span>
              <span className="rep-kpi-badge rep-badge-blue">Farm to Table</span>
            </div>
            <div className="rep-kpi-num">98.4%</div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-sub">Gentle crate cold-transit</span>
              <span className="rep-spark-bar rep-bar-blue" style={{ width: '98%' }} />
            </div>
          </div>
        </section>

        {/* View Tabs */}
        <div className="rep-tabs-bar">
          <button
            type="button"
            className={`rep-tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            📈 Financial & Volume Growth
          </button>
          <button
            type="button"
            className={`rep-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🥦 Produce Category Breakdown
          </button>
          <button
            type="button"
            className={`rep-tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
            onClick={() => setActiveTab('farmers')}
          >
            👨‍🌾 Farmer Payout & Settlement Ledger
          </button>
          <button
            type="button"
            className={`rep-tab-btn ${activeTab === 'b2b' ? 'active' : ''}`}
            onClick={() => setActiveTab('b2b')}
          >
            🏨 B2B Institutional vs Consumer Split
          </button>
        </div>

        {/* TAB 1: Financial & Volume Growth */}
        {activeTab === 'financial' && (
          <div className="rep-panel-grid">
            <div className="rep-card rep-chart-card">
              <div className="rep-card-head">
                <div>
                  <h3>6-Month Revenue & Farmer Remittance Trajectory</h3>
                  <p>Monthly Gross Marketplace Value vs Net Direct Farmer Payouts</p>
                </div>
                <div className="rep-legend">
                  <span className="rep-leg-item"><span className="rep-dot-dark" /> GMV</span>
                  <span className="rep-leg-item"><span className="rep-dot-green" /> Farmer Remittance</span>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="rep-chart-body">
                <div className="rep-bars-container">
                  {MONTHLY_TREND.map(item => {
                    const gmvHeight = (item.gmv / maxGmv) * 100;
                    const payoutHeight = (item.farmerPayout / maxGmv) * 100;
                    return (
                      <div key={item.month} className="rep-bar-col">
                        <div className="rep-bar-group">
                          <div
                            className="rep-bar rep-bar-gmv"
                            style={{ height: `${gmvHeight}%` }}
                            title={`GMV: ₹${item.gmv.toLocaleString('en-IN')}`}
                          >
                            <span className="rep-bar-tooltip">₹{(item.gmv / 100000).toFixed(1)}L</span>
                          </div>
                          <div
                            className="rep-bar rep-bar-payout"
                            style={{ height: `${payoutHeight}%` }}
                            title={`Farmer Share: ₹${item.farmerPayout.toLocaleString('en-IN')}`}
                          >
                            <span className="rep-bar-tooltip">₹{(item.farmerPayout / 100000).toFixed(1)}L</span>
                          </div>
                        </div>
                        <span className="rep-bar-label">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rep-chart-footer">
                <div className="rc-metric">
                  <span className="rc-lbl">Compounded Monthly Growth</span>
                  <strong className="rc-val">+17.2%</strong>
                </div>
                <div className="rc-metric">
                  <span className="rc-lbl">Gross Platform Margin</span>
                  <strong className="rc-val">10.4%</strong>
                </div>
                <div className="rc-metric">
                  <span className="rc-lbl">Settlement Time</span>
                  <strong className="rc-val">1.4 days</strong>
                </div>
              </div>
            </div>

            <div className="rep-card rep-summary-card">
              <div className="rep-card-head">
                <div>
                  <h3>Direct Trade Compliance</h3>
                  <p>Audit standards against traditional Mandi benchmarks</p>
                </div>
              </div>

              <div className="rep-comparison-list">
                <div className="rep-comp-row">
                  <span className="comp-name">Middlemen Brokerage Markup</span>
                  <div className="comp-badges">
                    <span className="comp-badge-bad">Mandi: 35–55%</span>
                    <span className="comp-badge-good">FreshHarvest: 0%</span>
                  </div>
                </div>

                <div className="rep-comp-row">
                  <span className="comp-name">Farmer Payout Percentage</span>
                  <div className="comp-badges">
                    <span className="comp-badge-bad">Mandi: 45–60%</span>
                    <span className="comp-badge-good">FreshHarvest: 82.0%</span>
                  </div>
                </div>

                <div className="rep-comp-row">
                  <span className="comp-name">Farmer Settlement Speed</span>
                  <div className="comp-badges">
                    <span className="comp-badge-bad">Mandi: 30–90 days credit</span>
                    <span className="comp-badge-good">FreshHarvest: 24–48 hours</span>
                  </div>
                </div>

                <div className="rep-comp-row">
                  <span className="comp-name">Farm-to-Door Transit Time</span>
                  <div className="comp-badges">
                    <span className="comp-badge-bad">Traditional: 4–7 days</span>
                    <span className="comp-badge-good">FreshHarvest: &lt; 36 hours</span>
                  </div>
                </div>
              </div>

              <div className="rep-audit-box">
                <strong>🛡️ Verified Fair Trade Certification</strong>
                <p>All transactions comply with direct bank transfer guidelines without hidden aggregator withholding.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Produce Category Breakdown */}
        {activeTab === 'categories' && (
          <div className="rep-card">
            <div className="rep-card-head">
              <div>
                <h3>Produce Yield by Agronomic Category</h3>
                <p>Volume, revenue contribution, and price stability across farm categories</p>
              </div>
            </div>

            <div className="rep-cat-grid">
              {CATEGORY_DATA.map(cat => (
                <div key={cat.name} className="rep-cat-card">
                  <div className="rep-cat-top">
                    <span className="rep-cat-dot" style={{ backgroundColor: cat.color }} />
                    <span className="rep-cat-name">{cat.name}</span>
                    <span className="rep-cat-share">{cat.share}%</span>
                  </div>
                  <div className="rep-cat-rev">₹{cat.revenue.toLocaleString('en-IN')}</div>
                  <div className="rep-cat-vol">Total Harvest: <strong>{cat.volume}</strong></div>
                  <div className="rep-cat-bar-bg">
                    <div className="rep-cat-bar-fill" style={{ width: `${cat.share * 2}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Farmer Payout & Settlement Ledger */}
        {activeTab === 'farmers' && (
          <div className="rep-card">
            <div className="rep-card-head">
              <div>
                <h3>Top Farm Producers & Settlement Audit</h3>
                <p>Verified grower volume, remittance percentage, and ratings</p>
              </div>
              <span className="rep-count-badge">5 High-Volume Growers</span>
            </div>

            <div className="rep-table-wrap">
              <table className="rep-table">
                <thead>
                  <tr>
                    <th>Farm Partner</th>
                    <th>Region / Cluster</th>
                    <th>Primary Harvest Crops</th>
                    <th>Fulfilled Orders</th>
                    <th>Direct Net Payout</th>
                    <th>Farmer Share</th>
                    <th>QA Rating</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_FARMERS.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div className="rt-farm-cell">
                          <strong>{f.name}</strong>
                          <span>{f.farmer}</span>
                        </div>
                      </td>
                      <td>📍 {f.location}</td>
                      <td>{f.produce}</td>
                      <td className="rt-num">{f.orders}</td>
                      <td className="rt-num rt-bold">{f.payout}</td>
                      <td><span className="rt-share-tag">{f.share}</span></td>
                      <td>⭐ {f.rating}</td>
                      <td><span className="rt-status-pill">{f.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: B2B Institutional vs Consumer Split */}
        {activeTab === 'b2b' && (
          <div className="rep-panel-grid">
            <div className="rep-card">
              <div className="rep-card-head">
                <div>
                  <h3>Institutional B2B Procurement Share</h3>
                  <p>Hotels, Hostel Messes, Canteens vs Direct Household Buyers</p>
                </div>
              </div>

              <div className="rep-split-meter">
                <div className="rep-split-bar">
                  <div className="rep-split-b2b" style={{ width: '58%' }}>B2B Commercial: 58%</div>
                  <div className="rep-split-b2c" style={{ width: '42%' }}>Household B2C: 42%</div>
                </div>
              </div>

              <div className="rep-split-details">
                <div className="rsd-card">
                  <h4>🏨 Institutional Bulk Procurement</h4>
                  <div className="rsd-num">₹14,41,648 GMV</div>
                  <p>18 Active recurring contracts across PSG Mess, Anandha Bhavan, and local industrial canteens.</p>
                  <ul>
                    <li>Average order weight: 140 kg</li>
                    <li>Standing weekly replenishment rate: 94%</li>
                  </ul>
                </div>

                <div className="rsd-card">
                  <h4>🏡 Consumer Household Marketplace</h4>
                  <div className="rsd-num">₹10,43,952 GMV</div>
                  <p>1,600+ direct doorstep deliveries to families across Erode, Coimbatore, and Tiruppur.</p>
                  <ul>
                    <li>Average basket value: ₹580</li>
                    <li>Repeat order cadence: Every 4.5 days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rep-card">
              <div className="rep-card-head">
                <div>
                  <h3>Agricultural Food Waste Prevention</h3>
                  <p>Surplus Channel Impact</p>
                </div>
              </div>

              <div className="rep-eco-stats">
                <div className="eco-metric">
                  <span className="eco-num">14,280 kg</span>
                  <span className="eco-lbl">Edible Produce Saved from Spoilage</span>
                </div>
                <div className="eco-metric">
                  <span className="eco-num">₹4,12,000</span>
                  <span className="eco-lbl">Recovered Revenue Paid to Farmers</span>
                </div>
                <div className="eco-metric">
                  <span className="eco-num">18.6 Tons</span>
                  <span className="eco-lbl">CO₂ Equivalent Greenhouse Gas Offset</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
