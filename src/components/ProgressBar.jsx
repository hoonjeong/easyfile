const ProgressBar = ({ progress, text }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="progress-text">{text || `변환 중... ${progress}%`}</p>
    </div>
  );
};

export default ProgressBar;
