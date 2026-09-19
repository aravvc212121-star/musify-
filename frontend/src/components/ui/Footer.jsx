import React from 'react'

export default function Footer() {
  return (
    <div style={{
      padding: '70px 16px 0px',
      marginBottom: '-40px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      opacity: 0.6,
    }}>
      <p style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: 500,
        color: '#fff',
        lineHeight: 1.4,
        maxWidth: '280px',
      }}>
        "not everything needs to be said out loud — just hit play."
      </p>
      <p style={{
        margin: 0,
        fontSize: '12px',
        fontWeight: 400,
        color: '#fff',
      }}>
        Built by Ayushman — Rhym.co
      </p>
    </div>
  )
}
