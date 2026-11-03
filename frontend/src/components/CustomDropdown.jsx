import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './CustomDropdown.css';

/**
 * Accessible Custom Dropdown Component
 * Features:
 * - 46px height, rounded corners, white background, custom chevron-down arrow
 * - Blue focus state (#2563EB) & soft shadow
 * - Full keyboard navigation (Arrow Up/Down, Enter/Space to select, Esc to close)
 * - Outside-click dismissal
 * - ARIA accessibility compliance
 */
const CustomDropdown = ({
  id,
  name,
  value,
  options = [],
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  required = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const items = menuRef.current.querySelectorAll('.custom-dropdown-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange({
      target: {
        name,
        value: option,
      },
    });
    setIsOpen(false);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`custom-dropdown-container ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        className={`custom-dropdown-trigger ${isOpen ? 'is-focused' : ''} ${error ? 'is-invalid' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <span className={`custom-dropdown-value ${!value ? 'custom-dropdown-placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <span className={`custom-dropdown-arrow ${isOpen ? 'is-open' : ''}`}>
          <ChevronDown size={18} />
        </span>
      </button>

      {isOpen && (
        <ul
          ref={menuRef}
          className="custom-dropdown-menu"
          role="listbox"
          aria-labelledby={id}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={option}
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-item ${isSelected ? 'is-selected' : ''} ${
                  isHighlighted ? 'is-highlighted' : ''
                }`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span>{option}</span>
                {isSelected && (
                  <span className="custom-dropdown-check">
                    <Check size={16} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
