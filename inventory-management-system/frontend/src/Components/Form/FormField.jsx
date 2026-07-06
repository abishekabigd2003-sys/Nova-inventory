import './Form.css';

export default function FormField({ 
  label, 
  error, 
  id, 
  children, 
  required = false 
}) {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="form-control-wrap">
        {children}
      </div>
      {error && <span className="form-error-msg">{error}</span>}
    </div>
  );
}
