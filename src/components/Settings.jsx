import { useState, useEffect } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { ConfirmDialog } from './ui/atoms.jsx';
import { storage } from '../services/storage.js';
import { POLLINATIONS_MODELS_URL } from '../config.js';


// IDs that should not appear in the trip model selector
const EXCLUDED = new Set([
  'openai-audio', 'openai-audio-large', 'gemini-search', 'gemini-flash-lite-3.1',
  'qwen-safety', 'qwen-coder', 'qwen-coder-large', 'qwen-vision',
  'midijourney', 'midijourney-large', 'glm', 'minimax', 'nova-fast',
  'llama-scout', 'perplexity-fast', 'perplexity-reasoning',
  'claude-fast', 'claude', 'gemini-fast', 'polly',
]);

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 9999, flexShrink: 0,
        background: checked ? PA.blue : '#D1D5DB',
        position: 'relative', cursor: 'pointer',
        transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.18)',
        transition: 'left .2s',
      }} />
    </div>
  );
}

export function Settings({ onClose, onLogout, onImport, isGuest }) {
  const [confirm, setConfirm]     = useState(null);
  const [settings, setSettings]   = useState(storage.getSettings);
  const [models, setModels]       = useState([]);

  useEffect(() => {
    fetch(POLLINATIONS_MODELS_URL)
      .then(r => r.json())
      .then(data => {
        const list = (data.data ?? []).filter(m =>
          m.supported_endpoints?.includes('/v1/chat/completions') &&
          m.input_modalities?.includes('text') &&
          m.output_modalities?.includes('text') &&
          !EXCLUDED.has(m.id)
        );
        setModels(list);
      })
      .catch(() => {});
  }, []);

  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    storage.saveSettings(next);
  };

  const modelOptions = models.length
    ? models
    : [{ id: settings.tripModel }]; // fallback while loading

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end',
          fontFamily: PA.font,
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          style={{
            width: '100%', maxWidth: 480, margin: '0 auto',
            background: '#fff', borderRadius: '24px 24px 0 0',
            padding: '0 0 max(24px,env(safe-area-inset-bottom))',
          }}
          className="anim-slideUp"
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E5E7EB' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 20px' }}>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>Settings</div>
            <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', padding: 6 }}>
              <Ic.close size={20} color={PA.muted} />
            </button>
          </div>

          <div style={{ padding: '0 20px 8px' }}>
            {/* Pollinations info */}
            <div style={{
              background: '#F8F9FA', borderRadius: 16, padding: '14px 16px',
              marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: PA.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ic.sparkle size={20} color={PA.ink} />
              </div>
              <div>
                {isGuest ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 14, color: PA.ink }}>Guest mode</div>
                    <div style={{ fontSize: 12.5, color: PA.muted, marginTop: 2 }}>Connect Pollinations to create trips.</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 14, color: PA.ink }}>Connected to Pollinations</div>
                    <div style={{ fontSize: 12.5, color: PA.muted, marginTop: 2 }}>AI key stored in this browser only. Expires in 30 days.</div>
                  </>
                )}
              </div>
            </div>

            {/* AI Settings */}
            <div style={{
              background: '#F8F9FA', borderRadius: 16, padding: '4px 0',
              marginBottom: 16, overflow: 'hidden',
            }}>
              {/* Model selector */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: PA.ink }}>Trip AI Model</div>
                    <div style={{ fontSize: 12, color: PA.muted, marginTop: 1 }}>Used when generating itineraries</div>
                  </div>
                  <select
                    value={settings.tripModel}
                    onChange={e => updateSetting('tripModel', e.target.value)}
                    style={{
                      border: `1.5px solid ${PA.hairline2}`,
                      borderRadius: 10, padding: '7px 10px',
                      fontSize: 13, fontWeight: 600, color: PA.ink,
                      background: '#fff', cursor: 'pointer',
                      fontFamily: PA.font, maxWidth: 170,
                    }}
                  >
                    {modelOptions.map(m => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: PA.hairline2, margin: '0 16px' }} />

              {/* Gemini images toggle */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: PA.ink }}>Photo search</div>
                    <div style={{ fontSize: 12, color: PA.muted, marginTop: 1, lineHeight: 1.4 }}>
                      Find real photos via Gemini.<br />Adds ~15s to trip creation.
                    </div>
                  </div>
                  <Toggle
                    checked={settings.useGeminiImages}
                    onChange={val => updateSetting('useGeminiImages', val)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {onImport && (
                <button
                  onClick={() => { onImport(); onClose(); }}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '13px 16px', borderRadius: 14,
                    border: `1px solid ${PA.hairline2}`, width: '100%', boxSizing: 'border-box',
                    color: PA.ink, fontWeight: 600, fontSize: 14,
                  }}
                >
                  <Ic.inbox size={16} color={PA.muted} />
                  Import Trip from file
                </button>
              )}
              <button
                onClick={() => setConfirm('logout')}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 16px', borderRadius: 14,
                  border: `1px solid ${PA.hairline2}`, width: '100%', boxSizing: 'border-box',
                  color: PA.ink, fontWeight: 600, fontSize: 14,
                }}
              >
                <Ic.unlock size={16} color={PA.ink} />
                {isGuest ? 'Connect Pollinations' : 'Disconnect Pollinations'}
              </button>

              <button
                onClick={() => setConfirm('clear')}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 16px', borderRadius: 14,
                  border: `1px solid ${PA.hairline2}`, width: '100%', boxSizing: 'border-box',
                  color: PA.red, fontWeight: 600, fontSize: 14,
                }}
              >
                <Ic.trash size={16} color={PA.red} />
                Clear all saved trips
              </button>
            </div>

            <div style={{ textAlign: 'center', paddingTop: 16, paddingBottom: 4 }}>
              <a
                href="https://github.com/HomerOff"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: PA.muted, textDecoration: 'none', fontWeight: 500 }}
              >
                Made by @HomerOff
              </a>
            </div>
          </div>
        </div>
      </div>

      {confirm === 'logout' && (
        <ConfirmDialog
          title="Disconnect Pollinations?"
          message="You will be signed out and need to reconnect your Pollinations account to use AI features."
          confirmLabel="Disconnect"
          confirmColor={PA.ink}
          onConfirm={() => { onLogout?.(); onClose(); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm === 'clear' && (
        <ConfirmDialog
          title="Clear all trips?"
          message="This will permanently delete all your saved trips and favorites. This cannot be undone."
          confirmLabel="Delete all"
          confirmColor={PA.red}
          onConfirm={() => {
            storage.clearAll();
            window.location.reload();
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
