import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import './DatePicker.css';

/**
 * Custom accessible DatePicker supporting DD/MM/YYYY display format
 * with custom-styled Pure Light Month & Year dropdowns, viewport-aware positioning,
 * and keyboard navigation.
 */
const DatePicker = ({
  name,
  id,
  value, // YYYY-MM-DD format
  onChange,
  maxDate, // Optional max YYYY-MM-DD (e.g. for DOB)
  minDate, // Optional min YYYY-MM-DD
  required = false,
  className = '',
  placeholder = 'DD/MM/YYYY',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupCoords, setPopupCoords] = useState({ top: 0, left: 0 });
  
  // Custom dropdown states for Month and Year inside calendar header
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const monthListRef = useRef(null);
  const yearListRef = useRef(null);
  const monthBtnRef = useRef(null);
  const yearBtnRef = useRef(null);

  // Parse date helper
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const initialDate = selectedDate || new Date();

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Calculate coordinates to render outside any overflow: auto / hidden parents
  const updatePopupPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const calendarHeight = 350;
    const calendarWidth = 300;

    let top = rect.bottom + window.scrollY + 6;
    let left = rect.left + window.scrollX;

    // If bottom overflow happens in viewport, flip upwards
    if (rect.bottom + calendarHeight > window.innerHeight && rect.top - calendarHeight > 0) {
      top = rect.top + window.scrollY - calendarHeight - 6;
    }

    // Keep within horizontal window boundaries
    if (left + calendarWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - calendarWidth - 12);
    }

    setPopupCoords({ top, left });
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) {
      setMonthDropdownOpen(false);
      setYearDropdownOpen(false);
      return;
    }

    updatePopupPosition();

    const handleScrollOrResize = () => {
      updatePopupPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePopupPosition]);

  // Close calendar or open sub-dropdowns on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inPopup = popupRef.current && popupRef.current.contains(e.target);
      if (!inContainer && !inPopup) {
        setIsOpen(false);
        setMonthDropdownOpen(false);
        setYearDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (monthDropdownOpen) {
          setMonthDropdownOpen(false);
          monthBtnRef.current?.focus();
        } else if (yearDropdownOpen) {
          setYearDropdownOpen(false);
          yearBtnRef.current?.focus();
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, monthDropdownOpen, yearDropdownOpen]);

  // Auto-scroll selected year into view when year dropdown opens
  useEffect(() => {
    if (yearDropdownOpen && yearListRef.current) {
      const activeItem = yearListRef.current.querySelector('.cal-picker-item.is-selected');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center' });
      }
    }
  }, [yearDropdownOpen]);

  // Auto-scroll selected month into view when month dropdown opens
  useEffect(() => {
    if (monthDropdownOpen && monthListRef.current) {
      const activeItem = monthListRef.current.querySelector('.cal-picker-item.is-selected');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'center' });
      }
    }
  }, [monthDropdownOpen]);

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      if (parsed) {
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
      }
    }
  }, [value]);

  // Format value to DD/MM/YYYY
  const formatDisplay = (valStr) => {
    if (!valStr) return '';
    const parts = valStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return valStr;
  };

  // Month navigation
  const prevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMonthDropdownOpen(false);
    setYearDropdownOpen(false);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const nextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMonthDropdownOpen(false);
    setYearDropdownOpen(false);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectMonth = (monthIdx) => {
    setCurrentMonth(monthIdx);
    setMonthDropdownOpen(false);
    monthBtnRef.current?.focus();
  };

  const handleSelectYear = (year) => {
    setCurrentYear(year);
    setYearDropdownOpen(false);
    yearBtnRef.current?.focus();
  };

  // Generate calendar days
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year choices (range around current date)
  const thisYear = new Date().getFullYear();
  const years = [];
  for (let y = thisYear - 100; y <= thisYear + 15; y++) {
    years.push(y);
  }

  const handleSelectDay = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${currentYear}-${formattedMonth}-${formattedDay}`;

    // Validate max and min
    if (maxDate && isoString > maxDate) return;
    if (minDate && isoString < minDate) return;

    onChange({
      target: {
        name,
        value: isoString,
      },
    });
    setIsOpen(false);
    setMonthDropdownOpen(false);
    setYearDropdownOpen(false);
  };

  const isDayDisabled = (day) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    if (maxDate && isoString > maxDate) return true;
    if (minDate && isoString < minDate) return true;
    return false;
  };

  const isDaySelected = (day) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonth &&
      today.getDate() === day
    );
  };

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div 
        className={`custom-datepicker-input-wrapper ${isOpen ? 'is-focused' : ''} ${disabled ? 'is-disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          id={id}
          name={name}
          readOnly
          value={formatDisplay(value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`form-control date-display-input ${className}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        />
        <button
          type="button"
          tabIndex={-1}
          className="calendar-icon-btn"
          aria-label="Toggle calendar"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
        >
          <CalendarIcon size={18} className="calendar-svg-icon" />
        </button>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={popupRef}
          className="custom-calendar-popup custom-calendar-portal" 
          role="dialog" 
          aria-modal="true"
          style={{
            position: 'absolute',
            top: `${popupCoords.top}px`,
            left: `${popupCoords.left}px`,
            zIndex: 99999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="calendar-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="calendar-selectors">
              {/* Custom Month Selector */}
              <div className="cal-picker-wrapper">
                <button
                  ref={monthBtnRef}
                  type="button"
                  className={`cal-picker-trigger ${monthDropdownOpen ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setYearDropdownOpen(false);
                    setMonthDropdownOpen(!monthDropdownOpen);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={monthDropdownOpen}
                >
                  <span className="cal-picker-val">{months[currentMonth]}</span>
                  <ChevronDown size={14} className={`cal-picker-chevron ${monthDropdownOpen ? 'is-open' : ''}`} />
                </button>

                {monthDropdownOpen && (
                  <ul 
                    ref={monthListRef} 
                    className="cal-picker-menu month-menu" 
                    role="listbox"
                    aria-label="Select month"
                  >
                    {months.map((m, idx) => {
                      const isCurrent = idx === currentMonth;
                      return (
                        <li
                          key={m}
                          role="option"
                          aria-selected={isCurrent}
                          className={`cal-picker-item ${isCurrent ? 'is-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMonth(idx);
                          }}
                        >
                          <span>{m}</span>
                          {isCurrent && <Check size={14} className="cal-picker-check" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Custom Year Selector */}
              <div className="cal-picker-wrapper">
                <button
                  ref={yearBtnRef}
                  type="button"
                  className={`cal-picker-trigger ${yearDropdownOpen ? 'is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMonthDropdownOpen(false);
                    setYearDropdownOpen(!yearDropdownOpen);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={yearDropdownOpen}
                >
                  <span className="cal-picker-val">{currentYear}</span>
                  <ChevronDown size={14} className={`cal-picker-chevron ${yearDropdownOpen ? 'is-open' : ''}`} />
                </button>

                {yearDropdownOpen && (
                  <ul 
                    ref={yearListRef} 
                    className="cal-picker-menu year-menu" 
                    role="listbox"
                    aria-label="Select year"
                  >
                    {years.map((y) => {
                      const isCurrent = y === currentYear;
                      return (
                        <li
                          key={y}
                          role="option"
                          aria-selected={isCurrent}
                          className={`cal-picker-item ${isCurrent ? 'is-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectYear(y);
                          }}
                        >
                          <span>{y}</span>
                          {isCurrent && <Check size={14} className="cal-picker-check" />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="calendar-weekdays">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Day Grid */}
          <div className="calendar-days-grid">
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="calendar-day-empty" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const disabledDay = isDayDisabled(day);
              const selected = isDaySelected(day);
              const today = isToday(day);

              return (
                <button
                  type="button"
                  key={day}
                  disabled={disabledDay}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDay(day);
                  }}
                  className={`calendar-day-btn ${selected ? 'is-selected' : ''} ${today ? 'is-today' : ''} ${disabledDay ? 'is-disabled' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer with Today and Clear quick actions */}
          <div className="calendar-footer">
            <button
              type="button"
              className="cal-btn-today"
              onClick={(e) => {
                e.stopPropagation();
                const now = new Date();
                const nowIso = now.toISOString().split('T')[0];
                if (!maxDate || nowIso <= maxDate) {
                  onChange({ target: { name, value: nowIso } });
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                  setIsOpen(false);
                  setMonthDropdownOpen(false);
                  setYearDropdownOpen(false);
                }
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="cal-btn-clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { name, value: '' } });
                setIsOpen(false);
                setMonthDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;
