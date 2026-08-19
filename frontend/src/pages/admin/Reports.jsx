import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Star,
  Building,
  CreditCard,
  User,
  Car,
  FileText,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { getAdminDashboard } from '../../api/admin.api';
import { getInvoices } from '../../api/invoices.api';
import { getBookings } from '../../api/bookings.api';
import { getReviews } from '../../api/reviews.api';
import { formatCurrency } from '../../utils/formatters';

export default function AdminReports() {
  const [dashboardData, setDashboardData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('ALL_TIME'); // ALL_TIME | THIS_MONTH | THIS_YEAR

  // Fetch data from existing APIs
  const fetchAllReportsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, invRes, bookRes, revRes] = await Promise.all([
        getAdminDashboard().catch(() => null),
        getInvoices().catch(() => ({ data: [] })),
        getBookings().catch(() => ({ data: [] })),
        getReviews().catch(() => ({ data: [] })),
      ]);

      if (dashRes && dashRes.success) {
        setDashboardData(dashRes.data || null);
      }

      setInvoices(Array.isArray(invRes?.data) ? invRes.data : Array.isArray(invRes) ? invRes : []);
      setBookings(Array.isArray(bookRes?.data) ? bookRes.data : Array.isArray(bookRes) ? bookRes : []);
      setReviews(Array.isArray(revRes?.data) ? revRes.data : Array.isArray(revRes) ? revRes : []);
    } catch (err) {
      console.error('Error fetching analytics reports:', err);
      setError(err.data?.message || err.message || 'Unable to load system analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllReportsData();
  }, [fetchAllReportsData]);

  // Helper date-range checker
  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    if (timeRange === 'THIS_MONTH') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeRange === 'THIS_YEAR') {
      return d.getFullYear() === now.getFullYear();
    }
    return true; // ALL_TIME
  };

  // Filter datasets by selected Time Range
  const filteredInvoices = invoices.filter((i) => isDateInRange(i.issuedAt || i.createdAt));
  const filteredBookings = bookings.filter((b) => isDateInRange(b.bookingDate || b.createdAt));
  const filteredReviews = reviews.filter((r) => isDateInRange(r.createdAt));

  // 1. FINANCIAL ANALYTICS
  const paidInvoices = filteredInvoices.filter((i) => i.paymentStatus === 'PAID');
  const pendingInvoices = filteredInvoices.filter((i) => i.paymentStatus === 'PENDING');

  const totalRevenueCollected = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const pendingInvoiceAmount = pendingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const avgInvoiceValue = filteredInvoices.length > 0
    ? filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0) / filteredInvoices.length
    : 0;

  // 2. BOOKING ANALYTICS
  const totalBookingsCount = filteredBookings.length;
  const completedBookingsCount = filteredBookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledBookingsCount = filteredBookings.filter((b) => b.status === 'CANCELLED').length;
  const inProgressBookingsCount = filteredBookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const confirmedBookingsCount = filteredBookings.filter((b) => b.status === 'CONFIRMED').length;
  const pendingBookingsCount = filteredBookings.filter((b) => b.status === 'PENDING').length;

  const completionRate = totalBookingsCount > 0 ? ((completedBookingsCount / totalBookingsCount) * 100).toFixed(1) : '0.0';
  const cancellationRate = totalBookingsCount > 0 ? ((cancelledBookingsCount / totalBookingsCount) * 100).toFixed(1) : '0.0';

  // 3. PAYMENT METHOD BREAKDOWN
  const paymentMethodsList = ['CASH', 'CARD', 'UPI', 'RAZORPAY', 'OTHER'];
  const paymentMethodStats = paymentMethodsList.map((method) => {
    const methodInvoices = filteredInvoices.filter((i) => (i.paymentMethod || 'CASH') === method);
    const paidMethodInvoices = methodInvoices.filter((i) => i.paymentStatus === 'PAID');
    const revenue = paidMethodInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

    return {
      method,
      totalCount: methodInvoices.length,
      paidCount: paidMethodInvoices.length,
      revenue,
    };
  });

  // 4. CUSTOMER SATISFACTION & REVIEWS ANALYTICS
  const totalReviewsCount = filteredReviews.length;
  const reviewRatingSum = filteredReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const avgReviewRating = totalReviewsCount > 0 ? (reviewRatingSum / totalReviewsCount).toFixed(1) : '0.0';

  const reviewStarCounts = {
    5: filteredReviews.filter((r) => r.rating === 5).length,
    4: filteredReviews.filter((r) => r.rating === 4).length,
    3: filteredReviews.filter((r) => r.rating === 3).length,
    2: filteredReviews.filter((r) => r.rating === 2).length,
    1: filteredReviews.filter((r) => r.rating === 1).length,
  };

  // 5. WORKSHOP PERFORMANCE AGGREGATION
  const workshopsMap = {};

  // Accumulate from bookings
  filteredBookings.forEach((b) => {
    const sc = b.serviceCenter;
    if (sc && typeof sc === 'object') {
      const scId = sc._id || sc.id;
      const scName = sc.name || 'Service Center';
      const scCity = sc.city || '';

      if (!workshopsMap[scId]) {
        workshopsMap[scId] = {
          id: scId,
          name: scName,
          city: scCity,
          completedBookings: 0,
          ratings: [],
        };
      }
      if (b.status === 'COMPLETED') {
        workshopsMap[scId].completedBookings += 1;
      }
    }
  });

  // Accumulate ratings from reviews
  filteredReviews.forEach((r) => {
    const sc = r.serviceCenter;
    if (sc && typeof sc === 'object') {
      const scId = sc._id || sc.id;
      const scName = sc.name || 'Service Center';
      const scCity = sc.city || '';

      if (!workshopsMap[scId]) {
        workshopsMap[scId] = {
          id: scId,
          name: scName,
          city: scCity,
          completedBookings: 0,
          ratings: [],
        };
      }
      if (r.rating) {
        workshopsMap[scId].ratings.push(r.rating);
      }
    }
  });

  const workshopsList = Object.values(workshopsMap).map((w) => {
    const reviewCount = w.ratings.length;
    const avgRating = reviewCount > 0 ? (w.ratings.reduce((a, b) => a + b, 0) / reviewCount).toFixed(1) : null;
    return {
      ...w,
      reviewCount,
      avgRating,
    };
  }).sort((a, b) => {
    if (b.completedBookings !== a.completedBookings) {
      return b.completedBookings - a.completedBookings;
    }
    return (parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0));
  });

  const formatINR = formatCurrency;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart3 size={28} color="var(--primary-accent)" />
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              System Analytics & Reports
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.2rem' }}>
            Monitor platform performance, revenue, bookings, and customer satisfaction.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* TIME RANGE SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--white)', padding: '0.3rem 0.6rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <Filter size={15} color="var(--text-secondary)" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ border: 'none', background: 'none', fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary-dark)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="ALL_TIME">All Time</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>

          <button
            type="button"
            className="btn-card-secondary"
            onClick={fetchAllReportsData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-accent)' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Generating executive analytics reports...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', backgroundColor: 'var(--white)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <AlertCircle size={36} style={{ color: '#EF4444', marginBottom: '0.8rem' }} />
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>Unable to Load System Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>{error}</p>
          <button type="button" className="btn-card-primary" onClick={fetchAllReportsData}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* SECTION 1: FINANCIAL OVERVIEW */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--primary-accent)" />
              Financial Overview
            </h3>
            <div className="dashboard-stats-grid">
              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Revenue Collected</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#10B981', marginTop: '0.25rem' }}>
                  {formatINR(totalRevenueCollected)}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  From {paidInvoices.length} paid invoices
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending Invoice Amount</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#D97706', marginTop: '0.25rem' }}>
                  {formatINR(pendingInvoiceAmount)}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  From {pendingInvoices.length} pending invoices
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Invoice Value</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
                  {formatINR(avgInvoiceValue)}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  Across {filteredInvoices.length} invoices
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Invoices Issued</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--primary-accent)', marginTop: '0.25rem' }}>
                  {filteredInvoices.length}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  Issued in selected period
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: BOOKING PERFORMANCE & RATES */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="var(--primary-accent)" />
              Booking Performance & Conversion Rates
            </h3>
            <div className="dashboard-stats-grid">
              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completion Rate</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#10B981', marginTop: '0.25rem' }}>
                  {completionRate}%
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  {completedBookingsCount} of {totalBookingsCount} bookings completed
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cancellation Rate</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#EF4444', marginTop: '0.25rem' }}>
                  {cancellationRate}%
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  {cancelledBookingsCount} of {totalBookingsCount} bookings cancelled
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>In-Progress & Confirmed</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: '#2563EB', marginTop: '0.25rem' }}>
                  {inProgressBookingsCount + confirmedBookingsCount}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  Active service appointments
                </span>
              </div>

              <div className="stat-card" style={{ backgroundColor: 'var(--white)', padding: '1.2rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Appointments</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'var(--primary-dark)', marginTop: '0.25rem' }}>
                  {totalBookingsCount}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
                  Booked in selected period
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: REVENUE BY PAYMENT METHOD & PAYMENT STATUS BREAKDOWN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* PAYMENT METHOD BREAKDOWN TABLE */}
            <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={18} color="var(--primary-accent)" />
                Revenue by Payment Method
              </h4>
              <div className="table-responsive-container">
                <table className="comparison-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Invoices</th>
                      <th>Paid</th>
                      <th style={{ textAlign: 'right' }}>Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethodStats.map((item) => (
                      <tr key={item.method}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{item.method}</span>
                        </td>
                        <td>{item.totalCount}</td>
                        <td>{item.paidCount}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }}>
                          {formatINR(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOOKING STATUS DISTRIBUTION */}
            <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} color="var(--primary-accent)" />
                Booking Status Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {[
                  { status: 'COMPLETED', count: completedBookingsCount, color: '#10B981' },
                  { status: 'CONFIRMED', count: confirmedBookingsCount, color: '#2563EB' },
                  { status: 'IN_PROGRESS', count: inProgressBookingsCount, color: '#8B5CF6' },
                  { status: 'PENDING', count: pendingBookingsCount, color: '#D97706' },
                  { status: 'CANCELLED', count: cancelledBookingsCount, color: '#EF4444' },
                ].map((item) => {
                  const pct = totalBookingsCount > 0 ? Math.round((item.count / totalBookingsCount) * 100) : 0;
                  return (
                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                      <span style={{ width: '100px', fontWeight: 600, color: 'var(--primary-dark)' }}>{item.status}</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: item.color, transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ width: '70px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 4: WORKSHOP PERFORMANCE LEADERBOARD */}
          <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} color="var(--primary-accent)" />
              Service Center & Workshop Performance
            </h3>

            {workshopsList.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                No workshop activity data recorded for selected time range.
              </p>
            ) : (
              <div className="table-responsive-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Workshop Name</th>
                      <th>Location City</th>
                      <th>Completed Services</th>
                      <th>Review Volume</th>
                      <th>Average Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshopsList.map((ws) => (
                      <tr key={ws.id}>
                        <td className="feature-name">
                          <strong style={{ color: 'var(--primary-dark)' }}>{ws.name}</strong>
                        </td>
                        <td>{ws.city || 'N/A'}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{ws.completedBookings}</span>
                        </td>
                        <td>{ws.reviewCount} reviews</td>
                        <td>
                          {ws.avgRating ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: '#F59E0B' }}>
                              <Star size={14} fill="#F59E0B" /> {ws.avgRating} / 5
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No reviews</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 5: CUSTOMER SATISFACTION ANALYTICS */}
          <div style={{ backgroundColor: 'var(--white)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
              Customer Satisfaction & Review Distribution
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {/* SATISFACTION SUMMARY STATS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Aggregate Customer Score</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.6rem', color: '#F59E0B', marginTop: '0.2rem' }}>
                    <Star size={24} fill="#F59E0B" /> {avgReviewRating} / 5
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Based on {totalReviewsCount} customer ratings</span>
                </div>
              </div>

              {/* STAR RATING BARS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewStarCounts[stars];
                  const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
                      <span style={{ width: '60px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        {stars} <Star size={12} fill="#F59E0B" color="#F59E0B" />
                      </span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: stars >= 4 ? '#10B981' : stars === 3 ? '#F59E0B' : '#EF4444',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ width: '80px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
