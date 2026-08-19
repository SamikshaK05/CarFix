import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Search,
  RotateCcw,
  UserCheck,
  Award,
  FileText,
  ArrowRight,
  Map,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import ServiceCenterCard from '../components/ServiceCenterCard';
import { getServiceCenters } from '../api/serviceCenters.api';
import './ServiceCenters.css';

const CATEGORIES = ['All Services', 'Maintenance', 'Repair', 'Diagnostics', 'Body & Detailing'];

export default function ServiceCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Services');

  const fetchCentersData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServiceCenters();
      const rawData = response.data || response;
      const apiList = Array.isArray(rawData) ? rawData : [];
      setCenters(apiList);
    } catch (err) {
      console.error('Error fetching service centers:', err.message);
      setError(err.data?.message || err.message || 'Failed to load service centers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentersData();
  }, []);

  const matchesCategory = (centerServices, category) => {
    if (category === 'All Services') return true;

    const maintenanceTags = ['General Service', 'Oil Change', 'AC Service', 'Battery Replacement', 'Wheel Alignment', 'Tyre Service', 'Maintenance'];
    const repairTags = ['Engine Repair', 'Brake Service', 'Suspension Repair', 'Transmission Service', 'Repair'];
    const diagTags = ['Car Diagnostics', 'Diagnostics', 'Engine Diagnostics'];
    const bodyTags = ['Detailing', 'Dent & Paint', 'Car Detailing', 'Body & Detailing'];

    let targetTags = [];
    if (category === 'Maintenance') targetTags = maintenanceTags;
    else if (category === 'Repair') targetTags = repairTags;
    else if (category === 'Diagnostics') targetTags = diagTags;
    else if (category === 'Body & Detailing') targetTags = bodyTags;

    return centerServices.some((srv) => {
      const srvName = typeof srv === 'string' ? srv : srv?.name || '';
      return targetTags.some((t) => srvName.toLowerCase().includes(t.toLowerCase()));
    });
  };

  const matchesSearch = (center, term) => {
    if (!term.trim()) return true;
    const lower = term.toLowerCase();
    const cName = (center.name || '').toLowerCase();
    const cCity = (center.city || '').toLowerCase();
    const cAddress = (center.address || center.location || '').toLowerCase();
    return cName.includes(lower) || cCity.includes(lower) || cAddress.includes(lower);
  };

  const normalizedCenters = centers.map((c) => ({
    id: c._id || c.id,
    name: c.name,
    city: c.city || '',
    location: c.address || c.location || `${c.city || ''} Center`,
    rating: typeof c.rating === 'number' ? c.rating : 0,
    reviews: typeof c.totalReviews === 'number' ? c.totalReviews : 0,
    hours: c.openingHours || '9:00 AM – 8:00 PM',
    status: c.isActive !== false ? 'Open Now' : 'Closed',
    services: Array.isArray(c.services)
      ? c.services.map((s) => (typeof s === 'object' ? s.name || 'General Service' : s))
      : ['General Service', 'Oil Change', 'Brake Service'],
  }));

  const filteredCenters = normalizedCenters.filter(
    (c) => matchesSearch(c, searchTerm) && matchesCategory(c.services, selectedCategory)
  );

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('All Services');
  };

  return (
    <div className="centers-page-container">
      {/* SECTION 1 — PAGE HERO */}
      <section className="centers-hero">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Service Centers</span>
        </nav>
        <h1 className="centers-hero-title">Find a CarFix Service Center</h1>
        <p className="centers-hero-subtitle">
          Find a convenient service location and get professional care for your vehicle.
        </p>
      </section>

      {/* SECTION 2 — SEARCH & FILTER */}
      <section className="search-filter-card">
        <div className="search-filter-controls">
          <div className="input-with-icon">
            <MapPin size={20} className="input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by city or location (e.g. Pune, Baner, Mumbai)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button type="button" className="btn-search">
            <Search size={18} />
            Search
          </button>

          <button type="button" className="btn-reset" onClick={handleReset} title="Reset filters">
            <RotateCcw size={18} style={{ marginRight: '0.3rem' }} />
            Reset
          </button>
        </div>

        {/* SECTION 5 — RESULTS COUNTER */}
        <div className="results-meta">
          <span className="results-count">
            {filteredCenters.length} {filteredCenters.length === 1 ? 'service center' : 'service centers'} found
          </span>
          {(searchTerm || selectedCategory !== 'All Services') && (
            <button type="button" className="btn-card-secondary" onClick={handleReset} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              Clear Search & Filter
            </button>
          )}
        </div>
      </section>

      {/* SECTION 3 & 5 — SERVICE CENTER GRID */}
      <section className="centers-grid">
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
            <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading service centers...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
            <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Failed to Load Service Centers</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
            <button type="button" className="btn-search" onClick={fetchCentersData}>
              Try Again
            </button>
          </div>
        ) : filteredCenters.length > 0 ? (
          filteredCenters.map((center) => <ServiceCenterCard key={center.id} center={center} />)
        ) : (
          <div className="no-centers-found">
            <h3>No service centers found.</h3>
            <p>Try searching for a different city or location like "Pune", "Mumbai", or "Bengaluru".</p>
            <button type="button" className="btn-search" onClick={handleReset}>
              View All Centers
            </button>
          </div>
        )}
      </section>

      {/* SECTION 6 — MAP PLACEHOLDER */}
      <section className="map-placeholder-section">
        <div className="map-header">
          <h2>Find Us Near You</h2>
          <p>Choose a convenient service center for your vehicle.</p>
        </div>
        <div className="map-mockup-card">
          <div className="map-pins-demo">
            <div className="map-pin-item pin-1">
              <MapPin size={16} color="#F97316" />
              <span>Pune Branches</span>
            </div>
            <div className="map-pin-item pin-2">
              <MapPin size={16} color="#F97316" />
              <span>Mumbai Branch</span>
            </div>
            <div className="map-pin-item pin-3">
              <MapPin size={16} color="#F97316" />
              <span>Bengaluru Branch</span>
            </div>
          </div>
          <div className="map-badge-soon">
            <Map size={20} color="#F97316" />
            Interactive map coming soon
          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY CHOOSE OUR SERVICE CENTERS */}
      <section className="why-centers-section">
        <div className="section-header">
          <h2>Why Choose a CarFix Service Center?</h2>
          <p>Equipped with state-of-the-art diagnostic gear and skilled mechanics.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <UserCheck size={26} />
            </div>
            <h3>Experienced Professionals</h3>
            <p>Certified automotive mechanics trained across multi-brand vehicles.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Award size={26} />
            </div>
            <h3>Quality-Focused Service</h3>
            <p>High quality service processes and genuine replacement parts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <FileText size={26} />
            </div>
            <h3>Transparent Process</h3>
            <p>Clear inspection reports and upfront price estimation before work begins.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <MapPin size={26} />
            </div>
            <h3>Convenient Locations</h3>
            <p>Easily accessible workshop centers across major cities.</p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — SERVICE CENTER EXPERIENCE */}
      <section className="steps-section">
        <div className="section-header">
          <h2>Simple 3-Step Service</h2>
          <p>Getting your vehicle serviced is hassle-free.</p>
        </div>
        <div className="steps-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="step-card">
            <span className="step-number">01</span>
            <h3>Choose a Center</h3>
          </div>
          <div className="step-card">
            <span className="step-number">02</span>
            <h3>Schedule Your Service</h3>
          </div>
          <div className="step-card">
            <span className="step-number">03</span>
            <h3>Get Your Car Serviced</h3>
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section className="services-cta-card">
        <h2>Need Help Choosing a Service?</h2>
        <p>Our team can help you find the right service for your vehicle.</p>
        <div className="services-cta-buttons">
          <Link to="/services" className="btn-cta-contact">
            Explore Services
            <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
          </Link>
          <Link to="/contact" className="btn-cta-centers">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
