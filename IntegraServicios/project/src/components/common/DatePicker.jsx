// components/common/DatePicker.jsx
import React, { useState } from "react";
import "./DatePicker.css";

const DatePicker = ({ value, onChange, minDate, maxDate, label, placeholder, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="datepicker-container">
      {label && <label className="datepicker-label">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        className="datepicker-input"
        placeholder={placeholder || "Selecciona una fecha"}
      />
    </div>
  );
};

export default DatePicker;