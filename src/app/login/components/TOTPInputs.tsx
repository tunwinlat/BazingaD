import type { LoginFormState } from '../hooks/useLogin';

interface TOTPInputsProps {
  useRecoveryCode: boolean;
  setUseRecoveryCode: (val: boolean) => void;
  formData: LoginFormState;
  setFormData: React.Dispatch<React.SetStateAction<LoginFormState>>;
}

export function TOTPInputs({ useRecoveryCode, setUseRecoveryCode, formData, setFormData }: TOTPInputsProps) {
  return (
    <>
      {useRecoveryCode ? (
        <div>
          <label htmlFor="recovery-code" className="block text-sm text-white/70 mb-2">Recovery Code</label>
          <input
            id="recovery-code"
            type="text"
            value={formData.recoveryCode}
            onChange={(e) => setFormData(prev => ({ ...prev, recoveryCode: e.target.value.toUpperCase() }))}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500 font-mono tracking-wider"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
          />
        </div>
      ) : (
        <div>
          <label htmlFor="totp-code" className="block text-sm text-white/70 mb-2">6-Digit Code</label>
          <input
            id="totp-code"
            type="text"
            value={formData.totpCode}
            onChange={(e) => setFormData(prev => ({ ...prev, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-white/40 outline-none focus:border-indigo-500 text-center text-2xl tracking-[0.5em] font-mono"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            placeholder="000000"
            maxLength={6}
            required
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setUseRecoveryCode(!useRecoveryCode);
          setFormData(prev => ({ ...prev, totpCode: '', recoveryCode: '' }));
        }}
        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        {useRecoveryCode ? 'Use authenticator code instead' : 'Use recovery code instead'}
      </button>
    </>
  );
}
