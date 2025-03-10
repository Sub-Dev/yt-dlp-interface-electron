"use client";

import React from "react";

interface LoadingModalProps {
  isOpen: boolean;
  message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "5px solid lightgray",
            borderTop: "5px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "10px", fontSize: "18px", fontWeight: "bold", color: "black", textAlign: "center" }}>
          {message}
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingModal;
