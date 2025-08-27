import React, { useEffect, useRef } from "react";

export const LogPanel = ({ log, onClose }) => {
  const messages = log ?? []; // fallback to empty array
  const panelRef = useRef(null);

  // Handle click outside to close on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Only add the event listener on mobile devices
    const isMobile = window.innerWidth <= 480;
    if (isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      if (isMobile) {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      }
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="log-panel">
      <h3>
        Game Log
        <button className="log-close-button" onClick={onClose}>
          ×
        </button>
      </h3>
      <div className="log-messages">
        {messages.length === 0 ? (
          <div className="log-entry">No messages yet.</div>
        ) : (
          messages.map((msg, index) => (
            <div key={`log-${index}-${msg.slice(0, 20)}`} className="log-entry">
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
