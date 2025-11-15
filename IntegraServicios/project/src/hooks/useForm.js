import { useState } from 'react';

const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (touched[name]) {
      validateField(name, newValue);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, values[name]);
  };

  const validateField = (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return;

    let error = '';

    if (rules.required && !value) {
      error = rules.requiredMessage || 'Este campo es requerido';
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMessage || 'Formato inválido';
    } else if (rules.minLength && value.length < rules.minLength) {
      error = rules.minLengthMessage || `Mínimo ${rules.minLength} caracteres`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      error = rules.maxLengthMessage || `Máximo ${rules.maxLength} caracteres`;
    } else if (rules.validate) {
      error = rules.validate(value, values) || '';
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error;
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationRules).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    );

    return isValid;
  };

  const reset = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
  };
};

export default useForm;
