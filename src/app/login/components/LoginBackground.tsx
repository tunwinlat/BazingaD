export function LoginBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute rounded-full animate-float"
        style={{
          width: '600px', height: '600px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          top: '-200px', right: '-100px',
          filter: 'blur(80px)', opacity: 0.5,
        }}
      />
      <div className="absolute rounded-full animate-float"
        style={{
          width: '500px', height: '500px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #10b981 100%)',
          bottom: '-150px', left: '-100px',
          filter: 'blur(80px)', opacity: 0.5,
          animationDelay: '-7s',
        }}
      />
    </div>
  );
}
