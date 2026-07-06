import { Construction } from 'lucide-react';
import './ComingSoon.css';

const ComingSoon = ({ title }) => {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <Construction size={64} />
        </div>
        <h1 className="coming-soon-title">{title || "Coming Soon"}</h1>
        <p className="coming-soon-text">
          We're working hard to bring you this enterprise module. Stay tuned for updates!
        </p>
        <button className="btn btn-primary" onClick={() => window.history.back()}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoon;
