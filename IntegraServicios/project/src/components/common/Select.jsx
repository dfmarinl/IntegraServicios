import './Select.css';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  error = '',
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`select-wrapper ${className}`}>
      {label && (
        <label htmlFor={name} className="select-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`select ${error ? 'select-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default Select;
