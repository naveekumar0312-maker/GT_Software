import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  AlertCircle 
} from 'lucide-react';
import { finalReportService } from '../services/finalReportApi';
import { firstReportService } from '../services/firstReportApi';
import DatePicker from '../components/DatePicker';
import CustomDropdown from '../components/CustomDropdown';
import FormField from '../components/FormField';
import ServicesClient from '../components/ServicesClient';
import BookingServicesDMC from '../components/BookingServicesDMC';
import FinalReportGST, { calculateGSTAmount } from '../components/FinalReportGST';
import FinalFinancialSummary from '../components/FinalFinancialSummary';
import PaymentCollection from '../components/PaymentCollection';
import PaymentSpent from '../components/PaymentSpent';
import PaymentBalanceSummary from '../components/PaymentBalanceSummary';
import DownloadPDFButton from '../components/DownloadPDFButton';
import '../styles/FirstReportForm.css';

const INITIAL_FORM_STATE = {
  // SECTION 1 – Tour Confirmation Details
  report_date: new Date().toISOString().split('T')[0],
  travel_date: '',
  tour_type: 'International',
  crm_id: '',
  sales_by: '',
  branch: 'Coimbatore',

  // SECTION 2 – Guest & Tour Details
  guest_name: '',
  mobile_no: '',
  dob: '',
  email_id: '',
  adults: 0,
  child: 0,
  total_pax: 0,
  client_type: 'Family',
  destination: '',
  duration: 1,
  rooms: 1,

  // SECTION 5 – GST Details & Calculation
  gst_collected: false,
  gst_collected_date: '',
  gst_percentage: 5,
  base_total_cost: '0.00',

  // SECTION 6 – Final Financial Summary: Manual Processing Fee
  processing_fee: '0.00',
};

const FinalReportForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const firstReportId = searchParams.get('first_report_id');
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [firstReportRef, setFirstReportRef] = useState(firstReportId || null);
  const [services, setServices] = useState([]);
  const [dmcServices, setDmcServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentsSpent, setPaymentsSpent] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(Boolean(isEditMode || firstReportId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Dropdown options
  const tourTypeOptions = ['International', 'Domestic'];
  const branchOptions = ['Coimbatore', 'Chennai', 'Erode', 'Tiruppur', 'Salem'];
  const clientTypeOptions = ['Family', 'Couple', 'Friends', 'Corporate', 'Group', 'Solo'];

  // Current date for DOB max constraint
  const todayIso = new Date().toISOString().split('T')[0];

  // Fetch either existing Final Report (Edit Mode) OR original First Report (Prefill Mode)
  useEffect(() => {
    // 1. EDIT MODE: Load existing Final Report
    if (isEditMode) {
      const fetchFinalReport = async () => {
        setLoadingInitial(true);
        setLoadError('');
        try {
          const data = await finalReportService.getById(id);
          const record = data.data || data;
          setFormData({
            report_date: record.report_date || '',
            travel_date: record.travel_date || '',
            tour_type: record.tour_type || 'International',
            crm_id: record.crm_id || '',
            sales_by: record.sales_by || '',
            branch: record.branch || 'Coimbatore',
            guest_name: record.guest_name || '',
            mobile_no: record.mobile_no || '',
            dob: record.dob || '',
            email_id: record.email_id || '',
            adults: record.adults ?? 0,
            child: record.child ?? 0,
            total_pax: (record.adults ?? 0) + (record.child ?? 0),
            client_type: record.client_type || 'Family',
            destination: record.destination || '',
            duration: record.duration ?? 1,
            rooms: record.rooms ?? 1,
            // GST fields
            gst_collected: Boolean(record.gst_collected),
            gst_collected_date: record.gst_collected_date || '',
            gst_percentage: record.gst_percentage !== undefined ? record.gst_percentage : 5,
            base_total_cost: record.base_total_cost !== undefined ? record.base_total_cost : '0.00',
            // Section 6 Processing Fee
            processing_fee: record.processing_fee !== undefined ? record.processing_fee : '0.00',
          });
          setFirstReportRef(record.first_report || null);

          // Preload client services
          if (Array.isArray(record.client_services)) {
            setServices(
              record.client_services.map((cs) => ({
                id: cs.id,
                service: cs.service || '',
                number_of_persons: cs.number_of_persons ?? 1,
                price_per_person: cs.price_per_person ?? '0.00',
                total_cost: cs.total_cost ?? '0.00',
                remarks: cs.remarks || '',
              }))
            );
          } else {
            setServices([]);
          }

          // Preload DMC booking services
          if (Array.isArray(record.dmc_services)) {
            setDmcServices(
              record.dmc_services.map((ds) => ({
                id: ds.id,
                service: ds.service || '',
                vendor: ds.vendor || '',
                contact_no: ds.contact_no || '',
                number_of_persons: ds.number_of_persons ?? 0,
                price_per_pax: ds.price_per_pax ?? '0.00',
                total_payable: ds.total_payable ?? '0.00',
              }))
            );
          } else {
            setDmcServices([]);
          }

          // Preload Payment Collection rows
          if (Array.isArray(record.payments)) {
            setPayments(
              record.payments.map((p) => ({
                id: p.id,
                payment_date: p.payment_date || '',
                amount: p.amount !== undefined ? String(p.amount) : '',
                payment_mode: p.payment_mode || '',
              }))
            );
          } else {
            setPayments([]);
          }

          // Preload Payment Spent rows
          if (Array.isArray(record.payments_spent)) {
            setPaymentsSpent(
              record.payments_spent.map((ps) => ({
                id: ps.id,
                details: ps.details || '',
                payment_date: ps.payment_date || '',
                amount: ps.amount !== undefined ? String(ps.amount) : '',
                payment_mode: ps.payment_mode || '',
              }))
            );
          } else {
            setPaymentsSpent([]);
          }
        } catch (err) {
          console.error('Error fetching final report for edit:', err);
          setLoadError('Failed to load existing Final Report from backend.');
        } finally {
          setLoadingInitial(false);
        }
      };

      fetchFinalReport();
      return;
    }

    // 2. PREFILL MODE: Auto-populate from selected First Report (Sections 1-4)
    if (firstReportId) {
      const fetchFirstReportForPrefill = async () => {
        setLoadingInitial(true);
        setLoadError('');
        try {
          const data = await firstReportService.getById(firstReportId);
          const record = data.data || data;

          if (!record || !record.id) {
            setLoadError(`Booking record #${firstReportId} was not found on the server.`);
            setLoadingInitial(false);
            return;
          }

          setFormData({
            report_date: record.report_date || todayIso,
            travel_date: record.travel_date || '',
            tour_type: record.tour_type || 'International',
            crm_id: record.crm_id || '',
            sales_by: record.sales_by || '',
            branch: record.branch || 'Coimbatore',
            guest_name: record.guest_name || '',
            mobile_no: record.mobile_no || '',
            dob: record.dob || '',
            email_id: record.email_id || '',
            adults: record.adults ?? 0,
            child: record.child ?? 0,
            total_pax: (record.adults ?? 0) + (record.child ?? 0),
            client_type: record.client_type || 'Family',
            destination: record.destination || '',
            duration: record.duration ?? 1,
            rooms: record.rooms ?? 1,
            // GST fields initialized to default (No GST, base cost 0.00)
            gst_collected: false,
            gst_collected_date: '',
            gst_percentage: 5,
            base_total_cost: '0.00',
            // Processing fee initialized to 0.00
            processing_fee: '0.00',
          });
          setFirstReportRef(record.id);

          // Copy ALL Section 3 Client Services rows from First Report
          if (Array.isArray(record.client_services) && record.client_services.length > 0) {
            setServices(
              record.client_services.map((cs) => {
                const persons = parseInt(cs.number_of_persons, 10) || 0;
                const price = parseFloat(cs.price_per_person) || 0;
                const total = Math.round(persons * price * 100) / 100;
                return {
                  id: `cs_prefill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  service: cs.service || '',
                  number_of_persons: persons,
                  price_per_person: price.toFixed(2),
                  total_cost: total.toFixed(2),
                  remarks: cs.remarks || '',
                };
              })
            );
          } else {
            setServices([]);
          }

          // Copy ALL Section 4 DMC Booking Services rows from First Report
          if (Array.isArray(record.dmc_services) && record.dmc_services.length > 0) {
            setDmcServices(
              record.dmc_services.map((ds) => {
                const persons = parseInt(ds.number_of_persons, 10) || 0;
                const price = parseFloat(ds.price_per_pax) || 0;
                const total = Math.round(persons * price * 100) / 100;
                return {
                  id: `dmc_prefill_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                  service: ds.service || '',
                  vendor: ds.vendor || '',
                  contact_no: ds.contact_no || '',
                  number_of_persons: persons,
                  price_per_pax: price.toFixed(2),
                  total_payable: total.toFixed(2),
                };
              })
            );
          } else {
            setDmcServices([]);
          }
        } catch (err) {
          console.error('Error fetching First Report for auto-prefill:', err);
          setLoadError(
            `Unable to load First Report #${firstReportId} from server. Please verify the booking exists.`
          );
        } finally {
          setLoadingInitial(false);
        }
      };

      fetchFirstReportForPrefill();
      return;
    }

    // Default: Blank form if accessed directly without param
    setLoadingInitial(false);
  }, [id, isEditMode, firstReportId, todayIso]);

  // Handle generic and specialized input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Clear specific field error
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // CRM ID – Numeric input (digits only)
    if (name === 'crm_id') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, crm_id: digitsOnly }));
      return;
    }

    // Mobile Number – Numeric input (max 10 digits)
    if (name === 'mobile_no') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, mobile_no: digitsOnly }));
      return;
    }

    // Adults and Child – Number inputs with Total Pax calculation
    if (type === 'number') {
      const numVal = Math.max(0, parseInt(value, 10) || 0);
      setFormData((prev) => {
        const next = { ...prev, [name]: numVal };
        if (name === 'adults' || name === 'child') {
          const currentAdults = name === 'adults' ? numVal : (prev.adults || 0);
          const currentChild = name === 'child' ? numVal : (prev.child || 0);
          next.total_pax = currentAdults + currentChild;
        }
        return next;
      });
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Section 5 GST changes
  const handleGSTChange = (gstState) => {
    if (errors.gst_collected_date || errors.gst_percentage || errors.base_total_cost) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.gst_collected_date;
        delete next.gst_percentage;
        delete next.base_total_cost;
        return next;
      });
    }

    setFormData((prev) => ({
      ...prev,
      gst_collected: gstState.gst_collected,
      gst_collected_date: gstState.gst_collected_date,
      gst_percentage: gstState.gst_percentage,
      base_total_cost: gstState.base_total_cost,
    }));
  };

  // Handle Section 6 Processing Fee change
  const handleProcessingFeeChange = (val) => {
    if (errors.processing_fee) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.processing_fee;
        return next;
      });
    }

    setFormData((prev) => ({
      ...prev,
      processing_fee: val,
    }));
  };

  // Calculate current GST Amount for passing into Section 6
  const currentGstAmount = useMemo(() => {
    return calculateGSTAmount(
      formData.base_total_cost,
      formData.gst_percentage,
      formData.gst_collected
    );
  }, [formData.base_total_cost, formData.gst_percentage, formData.gst_collected]);

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Section 1 - Tour Confirmation Details
    if (!formData.report_date) {
      newErrors.report_date = 'Date is required';
    }
    if (!formData.travel_date) {
      newErrors.travel_date = 'Date of Travel is required';
    }
    if (!formData.tour_type) {
      newErrors.tour_type = 'Tour Type is required';
    }
    if (!formData.crm_id.trim()) {
      newErrors.crm_id = 'CRM ID is required';
    } else if (!/^\d+$/.test(formData.crm_id.trim())) {
      newErrors.crm_id = 'CRM ID must contain digits only';
    }
    if (!formData.sales_by.trim()) {
      newErrors.sales_by = 'Sales By is required';
    }
    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }

    // Section 2 - Guest & Tour Details: Left Column
    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Guest Name is required';
    }
    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = 'Mobile No is required';
    } else {
      const cleanPhone = formData.mobile_no.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.mobile_no = 'Enter a valid 10-digit Indian mobile number';
      }
    }
    if (formData.dob && formData.dob > todayIso) {
      newErrors.dob = 'Date of Birth cannot be in the future';
    }
    if (formData.email_id && formData.email_id.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email_id.trim())) {
        newErrors.email_id = 'Enter a valid email address';
      }
    }

    // Section 2 - Middle Column
    if ((formData.adults || 0) + (formData.child || 0) <= 0) {
      newErrors.adults = 'At least 1 passenger (Adult or Child) is required';
    }

    // Section 2 - Right Column
    if (!formData.client_type) {
      newErrors.client_type = 'Client Type is required';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 day';
    }
    if (!formData.rooms || formData.rooms < 1) {
      newErrors.rooms = 'Rooms must be at least 1';
    }

    // Section 5 - GST Details Validation
    const baseCostNum = parseFloat(formData.base_total_cost);
    if (isNaN(baseCostNum) || baseCostNum < 0) {
      newErrors.base_total_cost = 'Base Total Cost must be a valid non-negative amount.';
    }

    if (formData.gst_collected) {
      if (!formData.gst_collected_date) {
        newErrors.gst_collected_date = 'GST Collected Date is required when GST is Yes.';
      }
      const gstPctNum = parseFloat(formData.gst_percentage);
      if (isNaN(gstPctNum) || gstPctNum < 1 || gstPctNum > 100) {
        newErrors.gst_percentage = 'Please select a valid GST Percentage between 1% and 100%.';
      }
    }

    // Section 6 - Processing Fee Validation
    const feeNum = parseFloat(formData.processing_fee);
    if (isNaN(feeNum) || feeNum < 0) {
      newErrors.processing_fee = 'Processing Fee cannot be negative.';
    }

    // Section 7 - Payment Collection Validation (only for entered rows)
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      const pAmt = parseFloat(p.amount);
      if (!p.payment_date) {
        newErrors[`payment_date_${i}`] = `Payment date is required for row ${i + 1}.`;
      }
      if (isNaN(pAmt) || pAmt < 0) {
        newErrors[`payment_amount_${i}`] = `Valid amount is required for row ${i + 1}.`;
      }
    }

    // Section 8 - Payment Spent Validation (only for entered rows)
    for (let i = 0; i < paymentsSpent.length; i++) {
      const ps = paymentsSpent[i];
      const psAmt = parseFloat(ps.amount);
      if (!ps.payment_date) {
        newErrors[`spent_payment_date_${i}`] = `Date is required for payment spent row ${i + 1}.`;
      }
      if (isNaN(psAmt) || psAmt < 0) {
        newErrors[`spent_amount_${i}`] = `Valid amount is required for payment spent row ${i + 1}.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      setServerError('Please review the highlighted fields and correct the errors.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        crm_id: formData.crm_id.trim(),
        guest_name: formData.guest_name.trim(),
        sales_by: formData.sales_by.trim(),
        destination: formData.destination.trim(),
        dob: formData.dob || null,
        email_id: formData.email_id.trim() || null,
        first_report: firstReportRef || null,
        // GST Fields
        gst_collected: formData.gst_collected,
        gst_collected_date: formData.gst_collected ? (formData.gst_collected_date || null) : null,
        gst_percentage: formData.gst_collected ? (parseFloat(formData.gst_percentage) || 0) : 0,
        base_total_cost: parseFloat(formData.base_total_cost) || 0,
        // Section 6 Processing Fee
        processing_fee: parseFloat(formData.processing_fee) || 0,
        client_services: services.map((s) => ({
          service: s.service ? s.service.trim() : '',
          number_of_persons: parseInt(s.number_of_persons, 10) || 0,
          price_per_person: parseFloat(s.price_per_person) || 0,
          remarks: s.remarks ? s.remarks.trim() : '',
        })),
        dmc_services: dmcServices.map((d) => ({
          service: d.service ? d.service.trim() : '',
          vendor: d.vendor ? d.vendor.trim() : '',
          contact_no: d.contact_no ? d.contact_no.trim() : '',
          number_of_persons: parseInt(d.number_of_persons, 10) || 0,
          price_per_pax: parseFloat(d.price_per_pax) || 0,
        })),
        // Section 7 Payment Collection
        payments: payments
          .filter((p) => p.payment_date && (parseFloat(p.amount) > 0 || (p.payment_mode && p.payment_mode.trim())))
          .map((p) => ({
            payment_date: p.payment_date,
            amount: parseFloat(p.amount) || 0,
            payment_mode: p.payment_mode ? p.payment_mode.trim() : 'Unspecified',
          })),
        // Section 8 Payment Spent
        payments_spent: paymentsSpent
          .filter((ps) => ps.payment_date && (parseFloat(ps.amount) > 0 || (ps.details && ps.details.trim()) || (ps.payment_mode && ps.payment_mode.trim())))
          .map((ps) => ({
            details: ps.details ? ps.details.trim() : 'Unspecified',
            payment_date: ps.payment_date,
            amount: parseFloat(ps.amount) || 0,
            payment_mode: ps.payment_mode ? ps.payment_mode.trim() : 'Unspecified',
          })),
      };

      if (isEditMode) {
        await finalReportService.update(id, payload);
        navigate('/final-report', {
          state: {
            flashMessage: `Final Report (CRM: ${payload.crm_id}) updated successfully.`,
          },
        });
      } else {
        await finalReportService.create(payload);
        navigate('/final-report', {
          state: {
            flashMessage: `Final Report created and saved successfully for CRM ID: ${payload.crm_id}.`,
          },
        });
      }
    } catch (err) {
      console.error('Error saving final report:', err);
      if (err.response && err.response.data) {
        const backendErrors = err.response.data.errors || err.response.data;
        if (typeof backendErrors === 'object') {
          const formatted = {};
          Object.keys(backendErrors).forEach((key) => {
            const val = backendErrors[key];
            formatted[key] = Array.isArray(val) ? val.join(' ') : String(val);
          });
          setErrors(formatted);
          setServerError(err.response.data.message || 'Validation failed on server. Please check errors below.');
        } else {
          setServerError(err.response.data.message || 'Failed to save the report.');
        }
      } else {
        setServerError('Unable to connect to the backend server. Please verify the Django API is running.');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      report_date: new Date().toISOString().split('T')[0],
      adults: 0,
      child: 0,
      total_pax: 0,
    });
    setServices([]);
    setDmcServices([]);
    setErrors({});
    setServerError('');
  };

  // Initial loading state
  if (loadingInitial) {
    return (
      <div className="first-report-form-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3>
            {isEditMode
              ? 'Loading Final Report Details...'
              : 'Fetching Booking Details from First Report...'}
          </h3>
          <p style={{ color: 'var(--muted-text)', marginTop: '8px' }}>
            Auto-filling confirmation sections, services, and calculating financial summary...
          </p>
        </div>
      </div>
    );
  }

  // Load error state with Back to List option
  if (loadError) {
    return (
      <div className="first-report-form-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="state-icon-wrapper" style={{ color: '#dc2626', margin: '0 auto 16px' }}>
            <AlertCircle size={36} />
          </div>
          <h3 style={{ fontSize: '20px', color: '#0f2744', marginBottom: '8px' }}>
            Unable to Load Booking
          </h3>
          <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px' }}>
            {loadError}
          </p>
          <Link to="/final-report" className="btn-view-action btn-view-back" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="first-report-form-page">
      {/* Header and Back Link */}
      <div className="form-page-header">
        <Link to="/final-report" className="back-nav-link" id="back-to-list-link">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <div className="form-header-banner">
          <div className="form-header-titles">
            <h1 className="form-main-heading">
              {isEditMode ? 'Edit Final Report' : 'Add New Final Report'}
            </h1>
            <p className="form-sub-heading">
              {isEditMode
                ? `Update final confirmation sheet details for CRM ID: ${formData.crm_id}`
                : firstReportId
                ? `Prefilled from First Report (CRM ID: ${formData.crm_id}) – Review services, GST calculations, and net profit.`
                : 'Enter tour confirmation details, guest passenger information, services, GST, and financial summary.'}
            </p>
          </div>
        </div>
      </div>

      {/* Server / Validation Error Notification */}
      {serverError && (
        <div className="form-alert alert-danger" role="alert">
          <AlertCircle size={20} className="alert-icon" />
          <div>{serverError}</div>
        </div>
      )}

      {/* Main Form – Exactly NINE Sections */}
      <form onSubmit={handleSubmit} noValidate className="report-form first-report-form final-report-sections">
        
        {/* ========================================================= */}
        {/* SECTION 1 – Tour Confirmation Details                     */}
        {/* ========================================================= */}
        <div className="report-section report-section-card">
          <div className="report-section-header">
            <div>
              <h2 className="report-section-heading">Tour Confirmation Details</h2>
              <p className="report-section-subheading">Core booking reference, travel date, sales person and branch</p>
            </div>
          </div>

          <div className="report-grid">
            {/* Row 1, Col 1: Date */}
            <FormField label="Date" required error={errors.report_date}>
              <DatePicker
                id="report_date"
                name="report_date"
                value={formData.report_date}
                onChange={handleChange}
                className={errors.report_date ? 'is-invalid' : ''}
                required
              />
            </FormField>

            {/* Row 1, Col 2: Date of Travel */}
            <FormField label="Date of Travel" required error={errors.travel_date}>
              <DatePicker
                id="travel_date"
                name="travel_date"
                value={formData.travel_date}
                onChange={handleChange}
                className={errors.travel_date ? 'is-invalid' : ''}
                required
              />
            </FormField>

            {/* Row 1, Col 3: Tour Type */}
            <FormField label="Tour Type" required error={errors.tour_type}>
              <CustomDropdown
                id="tour_type"
                name="tour_type"
                value={formData.tour_type}
                options={tourTypeOptions}
                onChange={handleChange}
                error={Boolean(errors.tour_type)}
                required
              />
            </FormField>

            {/* Row 2, Col 1: CRM ID */}
            <FormField label="CRM ID" required error={errors.crm_id}>
              <input
                type="text"
                id="crm_id"
                name="crm_id"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 8985"
                value={formData.crm_id}
                onChange={handleChange}
                className={`form-control ${errors.crm_id ? 'is-invalid' : ''}`}
                required
              />
            </FormField>

            {/* Row 2, Col 2: Sales By */}
            <FormField label="Sales By" required error={errors.sales_by}>
              <input
                type="text"
                id="sales_by"
                name="sales_by"
                placeholder="e.g. Anand"
                value={formData.sales_by}
                onChange={handleChange}
                className={`form-control ${errors.sales_by ? 'is-invalid' : ''}`}
                required
              />
            </FormField>

            {/* Row 2, Col 3: Branch */}
            <FormField label="Branch" required error={errors.branch}>
              <CustomDropdown
                id="branch"
                name="branch"
                value={formData.branch}
                options={branchOptions}
                onChange={handleChange}
                error={Boolean(errors.branch)}
                required
              />
            </FormField>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2 – Guest & Tour Details                          */}
        {/* ========================================================= */}
        <div className="report-section report-section-card">
          <div className="report-section-header">
            <div>
              <h2 className="report-section-heading">Guest & Tour Details</h2>
              <p className="report-section-subheading">Passenger contact information, pax counts, and itinerary details</p>
            </div>
          </div>

          <div className="report-guest-grid">
            {/* Left Column */}
            <div className="report-column">
              <FormField label="Guest Name" required error={errors.guest_name}>
                <input
                  type="text"
                  id="guest_name"
                  name="guest_name"
                  placeholder="Primary guest full name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  className={`form-control ${errors.guest_name ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>

              <FormField label="Mobile No" required error={errors.mobile_no}>
                <input
                  type="tel"
                  id="mobile_no"
                  name="mobile_no"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className={`form-control ${errors.mobile_no ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>

              <FormField label="DOB" error={errors.dob}>
                <DatePicker
                  id="dob"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  maxDate={todayIso}
                  placeholder="DD/MM/YYYY"
                  className={errors.dob ? 'is-invalid' : ''}
                />
              </FormField>

              <FormField label="Email ID" error={errors.email_id}>
                <input
                  type="email"
                  id="email_id"
                  name="email_id"
                  placeholder="e.g. guest@example.com"
                  value={formData.email_id}
                  onChange={handleChange}
                  className={`form-control ${errors.email_id ? 'is-invalid' : ''}`}
                />
              </FormField>
            </div>

            {/* Middle Column */}
            <div className="report-column">
              <FormField label="Adults" required error={errors.adults}>
                <input
                  type="number"
                  id="adults"
                  name="adults"
                  min="0"
                  value={formData.adults}
                  onChange={handleChange}
                  className={`form-control ${errors.adults ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>

              <FormField label="Child" error={errors.child}>
                <input
                  type="number"
                  id="child"
                  name="child"
                  min="0"
                  value={formData.child}
                  onChange={handleChange}
                  className={`form-control ${errors.child ? 'is-invalid' : ''}`}
                />
              </FormField>

              <FormField label="Total Pax" hint="Auto Calculated: Adults + Child">
                <input
                  type="number"
                  id="total_pax"
                  name="total_pax"
                  value={formData.total_pax}
                  readOnly
                  className="form-control"
                  title="Automatically calculated (Adults + Child)"
                />
              </FormField>

              {/* Column alignment placeholder */}
              <div className="report-field report-field-empty" aria-hidden="true"></div>
            </div>

            {/* Right Column */}
            <div className="report-column">
              <FormField label="Client Type" required error={errors.client_type}>
                <CustomDropdown
                  id="client_type"
                  name="client_type"
                  value={formData.client_type}
                  options={formData.client_type === 'Corporate Group' ? [...clientTypeOptions, 'Corporate Group'] : clientTypeOptions}
                  onChange={handleChange}
                  error={Boolean(errors.client_type)}
                  required
                />
              </FormField>

              <FormField label="Destination" required error={errors.destination}>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  placeholder="e.g. Dubai, Switzerland, Kashmir"
                  value={formData.destination}
                  onChange={handleChange}
                  className={`form-control ${errors.destination ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>

              <FormField label="Duration (Days)" required error={errors.duration}>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>

              <FormField label="Rooms" required error={errors.rooms}>
                <input
                  type="number"
                  id="rooms"
                  name="rooms"
                  min="1"
                  value={formData.rooms}
                  onChange={handleChange}
                  className={`form-control ${errors.rooms ? 'is-invalid' : ''}`}
                  required
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3 – Services (Client)                             */}
        {/* ========================================================= */}
        <ServicesClient
          services={services}
          onChange={setServices}
        />

        {/* ========================================================= */}
        {/* SECTION 4 – Booking Services (DMC)                        */}
        {/* ========================================================= */}
        <BookingServicesDMC
          dmcServices={dmcServices}
          onChange={setDmcServices}
        />

        {/* ========================================================= */}
        {/* SECTION 5 – GST Details & Calculation                     */}
        {/* ========================================================= */}
        <FinalReportGST
          gstCollected={formData.gst_collected}
          gstCollectedDate={formData.gst_collected_date}
          gstPercentage={formData.gst_percentage}
          baseTotalCost={formData.base_total_cost}
          onChange={handleGSTChange}
          errors={errors}
        />

        {/* ========================================================= */}
        {/* SECTION 6 – Final Financial Summary & Net Profit          */}
        {/* ========================================================= */}
        <FinalFinancialSummary
          clientServices={services}
          dmcServices={dmcServices}
          gstAmount={currentGstAmount}
          processingFee={formData.processing_fee}
          onProcessingFeeChange={handleProcessingFeeChange}
          error={errors.processing_fee}
        />

        {/* ========================================================= */}
        {/* SECTION 7 – Payment Collection                            */}
        {/* ========================================================= */}
        <PaymentCollection
          payments={payments}
          onChange={setPayments}
          errors={errors}
        />

        {/* ========================================================= */}
        {/* SECTION 8 – Payment Spent                                 */}
        {/* ========================================================= */}
        <PaymentSpent
          paymentsSpent={paymentsSpent}
          onChange={setPaymentsSpent}
          errors={errors}
        />

        {/* ========================================================= */}
        {/* SECTION 9 – Payment Balance Summary                       */}
        {/* ========================================================= */}
        <PaymentBalanceSummary
          clientServices={services}
          dmcServices={dmcServices}
          payments={payments}
          paymentsSpent={paymentsSpent}
        />

        {/* Action Button Bar */}
        <div className="form-actions-bar">
          {!isEditMode && (
            <button
              type="button"
              className="btn-form btn-cancel"
              onClick={handleReset}
              disabled={isSubmitting}
              id="reset-form-btn"
            >
              <RotateCcw size={16} />
              <span>Reset Form</span>
            </button>
          )}

          <Link
            to="/final-report"
            className="btn-form btn-cancel"
            id="cancel-btn"
          >
            <span>Cancel</span>
          </Link>

          {isEditMode && id && (
            <DownloadPDFButton
              reportType="final"
              reportId={id}
              crmId={formData.crm_id}
              className="btn-form"
            >
              Download PDF
            </DownloadPDFButton>
          )}

          <button
            type="submit"
            className="btn-form btn-submit"
            disabled={isSubmitting}
            id="save-report-btn"
          >
            <Save size={16} />
            <span>
              {isSubmitting
                ? isEditMode ? 'Updating...' : 'Saving...'
                : isEditMode ? 'Update Final Report' : 'Save Final Report'}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default FinalReportForm;
