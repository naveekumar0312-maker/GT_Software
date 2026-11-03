import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { firstReportService } from '../services/firstReportApi';
import DatePicker from '../components/DatePicker';
import CustomDropdown from '../components/CustomDropdown';
import FormField from '../components/FormField';
import ServicesClient from '../components/ServicesClient';
import BookingServicesDMC from '../components/BookingServicesDMC';
import ProfitSummary from '../components/ProfitSummary';
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
};

const FirstReportForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [services, setServices] = useState([]);
  const [dmcServices, setDmcServices] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Dropdown options
  const tourTypeOptions = ['International', 'Domestic'];
  const branchOptions = ['Coimbatore', 'Chennai', 'Erode', 'Tiruppur', 'Salem'];
  const clientTypeOptions = ['Family', 'Couple', 'Friends', 'Corporate', 'Group', 'Solo'];

  // Current date for DOB max constraint
  const todayIso = new Date().toISOString().split('T')[0];

  // If in edit mode, fetch existing record
  useEffect(() => {
    if (!isEditMode) return;

    const fetchReport = async () => {
      setLoadingInitial(true);
      try {
        const data = await firstReportService.getById(id);
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
        });

        // Preload client services if any
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

        // Preload DMC booking services if any
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
      } catch (err) {
        console.error('Error fetching report for edit:', err);
        setServerError('Failed to load existing report data from backend.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchReport();
  }, [id, isEditMode]);

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

  // Client-side validation
  const validateForm = () => {
    const newErrors = {};

    // Section 1
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

    // Section 2 - Left Column
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
      };

      if (isEditMode) {
        await firstReportService.update(id, payload);
        // Navigate back to list with success flash message
        navigate('/first-report', {
          state: {
            flashMessage: `First Report (CRM: ${payload.crm_id}) updated successfully.`,
          },
        });
      } else {
        await firstReportService.create(payload);
        // Navigate back to list with success flash message
        navigate('/first-report', {
          state: {
            flashMessage: `First Report saved successfully for CRM ID: ${payload.crm_id}.`,
          },
        });
      }
    } catch (err) {
      console.error('Error saving first report:', err);
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

  // Reset form to blank
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

  if (loadingInitial) {
    return (
      <div className="first-report-form-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <h3>Loading Report Details...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="first-report-form-page">
      {/* Header and Back Link */}
      <div className="form-page-header">
        <Link to="/first-report" className="back-nav-link" id="back-to-list-link">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <div className="form-header-banner">
          <div className="form-header-titles">
            <h1 className="form-main-heading">
              {isEditMode ? 'Edit First Report' : 'Add New First Report'}
            </h1>
            <p className="form-sub-heading">
              {isEditMode
                ? `Update tour confirmation sheet details for CRM ID: ${formData.crm_id}`
                : 'Enter tour confirmation details and guest passenger information.'}
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

      {/* Main Form – Exactly TWO Sections */}
      <form onSubmit={handleSubmit} noValidate className="first-report-form">
        
        {/* ========================================================= */}
        {/* SECTION 1 – Tour Confirmation Details                     */}
        {/* ========================================================= */}
        <div className="report-section">
          <h2 className="section-heading">Tour Confirmation Details</h2>

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
                placeholder="Sales Executive Name"
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
        {/* SECTION 2 – Guest & Tour Details                         */}
        {/* ========================================================= */}
        <div className="report-section">
          <h2 className="section-heading">Guest & Tour Details</h2>

          <div className="report-grid">
            {/* Left Column */}
            <div className="report-column">
              <FormField label="Guest Name" required error={errors.guest_name}>
                <input
                  type="text"
                  id="guest_name"
                  name="guest_name"
                  placeholder="Full Name of Primary Guest"
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
        {/* SECTION 5 – Profit Summary                                */}
        {/* ========================================================= */}
        <ProfitSummary
          clientServices={services}
          dmcServices={dmcServices}
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
            to="/first-report"
            className="btn-form btn-cancel"
            id="cancel-btn"
          >
            <span>Cancel</span>
          </Link>

          {isEditMode && id && (
            <DownloadPDFButton
              reportType="first"
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
                : isEditMode ? 'Update Report' : 'Save Report'}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default FirstReportForm;
