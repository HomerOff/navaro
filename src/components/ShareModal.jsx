import { useState } from 'react';
import { PA } from '../tokens.js';
import { Ic } from '../icons.jsx';
import { Spinner } from './ui/atoms.jsx';
import { uploadTripToBlob, buildShareUrl, exportTripAsFile } from '../services/share.js';

export function ShareModal({ trip, onClose }) {
  const [tab, setTab]         = useState('link'); // 'link' | 'file'
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');

  const handleGenerateLink = async () => {
    setLoading(true);
    setError('');
    try {
      const blobId = await uploadTripToBlob(trip);
      setShareUrl(buildShareUrl(blobId));
    } catch (e) {
      setError(e.message || 'Failed to generate link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportFile = () => {
    try {
      exportTripAsFile(trip);
    } catch (e) {
      setError(e.message || 'Export failed.');
    }
  };

  return (
    <div
      className="anim-fadeIn"
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        fontFamily: PA.font,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="anim-slideUp"
        style={{
          width: '100%', maxWidth: 480,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '0 20px max(28px,env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 9999, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Share Trip</div>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', padding: 6 }}>
            <Ic.close size={20} color={PA.muted} />
          </button>
        </div>

        {/* Trip info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: PA.chip, borderRadius: 14, padding: '10px 14px', marginBottom: 18,
        }}>
          <Ic.map size={18} color={PA.blue} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.title}</div>
            <div style={{ color: PA.muted, fontSize: 12, marginTop: 1 }}>{trip.days} days · {trip.totalSpots} spots</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#F4F5F2', borderRadius: 14, padding: 4, marginBottom: 20, gap: 4 }}>
          {[
            { id: 'link', icon: <Ic.globe size={15} color={tab === 'link' ? PA.blue : PA.muted} />, label: 'Share Link' },
            { id: 'file', icon: <Ic.share size={15} color={tab === 'file' ? PA.blue : PA.muted} />, label: 'Export File' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14,
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? PA.ink : PA.muted,
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                transition: 'all .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Link tab */}
        {tab === 'link' && (
          <div>
            <div style={{ color: PA.muted, fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>
              Generate a link to share this trip. Anyone with the link can open and save it in Navaro.
              <br />
              <span style={{ color: PA.mutedSoft, fontSize: 12 }}>Links expire after 30 days.</span>
            </div>

            {!shareUrl ? (
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
                  background: loading ? PA.muted : PA.black, color: '#fff',
                  border: 'none', cursor: loading ? 'default' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(0,0,0,.18)',
                }}
              >
                {loading ? <><Spinner size={18} color="#fff" /> Generating…</> : <><Ic.globe size={18} color="#fff" /> Generate Link</>}
              </button>
            ) : (
              <div>
                {/* URL display */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: PA.chip, borderRadius: 14, padding: '12px 14px',
                  marginBottom: 12,
                }}>
                  <div style={{
                    flex: 1, fontSize: 13, color: PA.ink, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    style={{
                      all: 'unset', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 9999,
                      background: copied ? PA.greenSoft : PA.blueSoft,
                      color: copied ? PA.green : PA.blueDeep,
                      fontWeight: 700, fontSize: 13,
                      transition: 'all .2s',
                    }}
                  >
                    {copied ? <><Ic.check size={14} /> Copied!</> : <><Ic.copy size={14} color={PA.blue} /> Copy</>}
                  </button>
                </div>

                {/* Share via native share API if available */}
                {navigator.share && (
                  <button
                    onClick={() => navigator.share({ title: trip.title, text: `Check out my trip: ${trip.title}`, url: shareUrl })}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '13px', borderRadius: 9999, fontWeight: 700, fontSize: 14,
                      background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Ic.share size={16} color="#fff" /> Share via…
                  </button>
                )}

                <button
                  onClick={() => { setShareUrl(''); setCopied(false); }}
                  style={{
                    all: 'unset', cursor: 'pointer', display: 'block',
                    textAlign: 'center', width: '100%', marginTop: 10,
                    color: PA.muted, fontSize: 13, fontWeight: 600,
                  }}
                >
                  Generate new link
                </button>
              </div>
            )}
          </div>
        )}

        {/* File tab */}
        {tab === 'file' && (
          <div>
            <div style={{ color: PA.muted, fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>
              Export this trip as a <strong style={{ color: PA.ink }}>.navaro</strong> file. Send it via email, messenger, or any file sharing app. The recipient can import it in Navaro.
            </div>

            <button
              onClick={handleExportFile}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 9999, fontWeight: 700, fontSize: 15,
                background: PA.black, color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,.18)',
                marginBottom: 12,
              }}
            >
              <Ic.share size={18} color="#fff" /> Download .navaro file
            </button>

            <div style={{
              background: PA.blueSoft, borderRadius: 12, padding: '10px 14px',
              color: PA.blueDeep, fontSize: 13, lineHeight: 1.5,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Ic.info size={16} color={PA.blue} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>The recipient opens Navaro and uses <strong>Import Trip</strong> to load the file.</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: PA.red, fontSize: 13, fontWeight: 600, marginTop: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
