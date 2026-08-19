import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Droplets,
  Disc,
  Cpu,
  Wind,
  Zap,
  Compass,
  CircleDot,
  Gauge,
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap as ActivityIcon,
  Shield,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import ServiceCard from '../components/ServiceCard';
import { getServices } from '../api/services.api';
import serviceMattersImg from '../assets/service-matters.png';
import './Services.css';

// Icon mapping helper for service categories/names
const getServiceIcon = (category, name = '') => {
  const lowerName = name.toLowerCase();
  const lowerCat = category ? category.toLowerCase() : '';

  if (lowerName.includes('oil')) return Droplets;
  if (lowerName.includes('brake')) return Disc;
  if (lowerName.includes('engine') || lowerName.includes('tuning')) return Cpu;
  if (lowerName.includes('ac') || lowerName.includes('air')) return Wind;
  if (lowerName.includes('battery') || lowerName.includes('electric')) return Zap;
  if (lowerName.includes('alignment') || lowerName.includes('wheel')) return Compass;
  if (lowerName.includes('tyre') || lowerName.includes('tire')) return CircleDot;
  if (lowerName.includes('diagnostic')) return Gauge;
  if (lowerName.includes('suspension')) return Sliders;
  if (lowerName.includes('dent') || lowerName.includes('paint')) return Sparkles;
  if (lowerName.includes('detail') || lowerName.includes('wash')) return ShieldCheck;

  if (lowerCat.includes('repair')) return Cpu;
  if (lowerCat.includes('diagnostic')) return Gauge;
  if (lowerCat.includes('detail') || lowerCat.includes('body')) return ShieldCheck;

  return Wrench;
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [selectedService, setSelectedService] = useState(null);

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getServices();
      const rawData = response.data || response;
      const apiList = Array.isArray(rawData) ? rawData : [];
      setServices(apiList);
    } catch (err) {
      console.error('Error fetching services:', err.message);
      setError(err.data?.message || err.message || 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, []);

  // Compute dynamic category filter list
  const categoriesList = ['All Services'];
  services.forEach((s) => {
    if (s.category && !categoriesList.includes(s.category)) {
      categoriesList.push(s.category);
    }
  });

  // Filter services by selected category and search term
  const filteredServices = services.filter((s) => {
    const matchesCategory = activeCategory === 'All Services' || s.category === activeCategory;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (s.name || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  const handleViewService = (service) => {
    setSelectedService(service);
  };

  return (
    <div className="services-page-container">
      {/* SECTION 1 — PAGE HERO */}
      <section className="services-hero">
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Services</span>
        </nav>
        <h1 className="services-hero-title">Professional Car Services</h1>
        <p className="services-hero-subtitle">
          From routine maintenance to complex repairs, CarFix provides reliable services to keep your vehicle performing at its best.
        </p>
      </section>

      {/* SECTION 2 — SERVICE CATEGORY FILTER & SEARCH */}
      <section className="filter-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: '1', minWidth: '260px' }}>
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search services by name or description (e.g. Oil, Brake, Diagnostic)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(searchTerm || activeCategory !== 'All Services') && (
            <button
              type="button"
              className="btn-card-secondary"
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('All Services');
              }}
              style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="filter-bar">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 3 & 5 — SERVICE CARDS GRID */}
      <section className="services-grid-container">
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
            <Loader2 size={36} className="spinning-loader" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading services...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
            <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.8rem' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Failed to Load Services</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
            <button type="button" className="btn-card-primary" onClick={fetchServicesData}>
              Try Again
            </button>
          </div>
        ) : filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const normalized = {
              id: service._id || service.id,
              name: service.name,
              category: service.category || 'General Service',
              startingPrice: typeof service.price === 'number' ? `₹${service.price}` : service.startingPrice || '₹0',
              duration: typeof service.duration === 'number' ? `${service.duration} mins` : service.duration || 'N/A',
              description: service.description || 'Professional car service by certified mechanics.',
              icon: getServiceIcon(service.category, service.name),
            };
            return (
              <ServiceCard key={normalized.id} service={normalized} onView={handleViewService} />
            );
          })
        ) : (
          <div className="no-services-found" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            No services found matching your search.
          </div>
        )}
      </section>

      {/* SECTION 6 — PROFESSIONAL SERVICE SECTION */}
      <section className="why-pro-section">
        <div className="why-pro-content">
          <h2>Why Professional Car Service Matters</h2>
          <p>
            Regular professional maintenance helps improve vehicle reliability, safety and long-term performance.
            Trusting experts ensures your car receives accurate diagnostics, genuine parts, and precision care.
          </p>
          <div className="why-pro-points">
            <div className="why-pro-point">
              <div className="point-icon">
                <ActivityIcon size={20} />
              </div>
              <div className="point-info">
                <h4>1. Better Vehicle Performance</h4>
                <p>Engine tuning and oil updates keep fuel efficiency optimal and performance sharp.</p>
              </div>
            </div>

            <div className="why-pro-point">
              <div className="point-icon">
                <Shield size={20} />
              </div>
              <div className="point-info">
                <h4>2. Improved Safety</h4>
                <p>Routine brake, suspension, and steering checks minimize accident risks on the road.</p>
              </div>
            </div>

            <div className="why-pro-point">
              <div className="point-icon">
                <Clock size={20} />
              </div>
              <div className="point-info">
                <h4>3. Longer Vehicle Life</h4>
                <p>Preventive maintenance stops minor wear and tear from turning into expensive engine failures.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="why-pro-visual">
          <img
            src={serviceMattersImg}
            alt="Professional Car Service Diagnostics"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </section>

      {/* SECTION 7 — SERVICE PROCESS */}
      <section className="services-process-section">
        <div className="section-header">
          <h2>Simple Service Process</h2>
          <p>4 easy steps to get your car serviced professionally.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01</span>
            <h3>Choose Your Service</h3>
          </div>
          <div className="step-card">
            <span className="step-number">02</span>
            <h3>Select a Service Center</h3>
          </div>
          <div className="step-card">
            <span className="step-number">03</span>
            <h3>Schedule Your Visit</h3>
          </div>
          <div className="step-card">
            <span className="step-number">04</span>
            <h3>Get Your Car Serviced</h3>
          </div>
        </div>
      </section>

      {/* SECTION 8 — CTA */}
      <section className="services-cta-card">
        <h2>Not Sure What Your Car Needs?</h2>
        <p>Our professionals can help identify the right service for your vehicle.</p>
        <div className="services-cta-buttons">
          <Link to="/contact" className="btn-cta-contact">
            Contact Us
            <ArrowRight size={18} style={{ marginLeft: '0.4rem' }} />
          </Link>
          <Link to="/centers" className="btn-cta-centers">
            View Service Centers
          </Link>
        </div>
      </section>
    </div>
  );
}
