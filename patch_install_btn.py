with open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. CSS for install banner ─────────────────────────────────────────────
install_css = """
/* PWA Install Banner */
#pwa-install-banner {
  display: none;
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1.5px solid #c9a84c;
  border-radius: 16px;
  padding: 14px 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  min-width: 280px;
  max-width: 92vw;
  direction: rtl;
  animation: slideUp 0.35s ease;
}
@keyframes slideUp {
  from { opacity:0; transform: translateX(-50%) translateY(30px); }
  to   { opacity:1; transform: translateX(-50%) translateY(0); }
}
#pwa-install-banner .pwa-banner-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
#pwa-install-banner .pwa-icon {
  font-size: 2em;
  flex-shrink: 0;
}
#pwa-install-banner .pwa-text {
  flex: 1;
}
#pwa-install-banner .pwa-title {
  color: #c9a84c;
  font-size: 0.95em;
  font-weight: 700;
  margin-bottom: 2px;
}
#pwa-install-banner .pwa-sub {
  color: #a0a8b8;
  font-size: 0.78em;
}
#pwa-install-banner .pwa-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
#pwa-install-banner .pwa-btn-install {
  background: linear-gradient(135deg, #c9a84c, #e6c76a);
  color: #1a1a2e;
  border: none;
  border-radius: 10px;
  padding: 8px 20px;
  font-size: 0.9em;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
#pwa-install-banner .pwa-btn-install:hover { filter: brightness(1.1); }
#pwa-install-banner .pwa-btn-close {
  background: transparent;
  color: #a0a8b8;
  border: 1px solid #3a3a5a;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.85em;
  cursor: pointer;
  font-family: inherit;
}
#pwa-install-banner .pwa-btn-close:hover { color: #fff; border-color: #666; }
"""

# Insert before </style>
html = html.replace('</style>', install_css + '\n</style>', 1)

# ── 2. HTML for install banner (inject before </body>) ────────────────────
install_html = """
<!-- PWA Install Banner -->
<div id="pwa-install-banner">
  <div class="pwa-banner-row">
    <div class="pwa-icon">&#x1F4D6;</div>
    <div class="pwa-text">
      <div class="pwa-title">&#x1F4F2; نوای قرآن را نصب کنید</div>
      <div class="pwa-sub">بدون مرورگر، مثل یک App واقعی باز میشود</div>
    </div>
  </div>
  <div class="pwa-actions">
    <button class="pwa-btn-close" onclick="dismissInstallBanner()">بستن</button>
    <button class="pwa-btn-install" onclick="triggerInstall()">&#x2B07; نصب کنید</button>
  </div>
</div>
"""

# ── 3. JS for install logic (inject before </body>) ───────────────────────
install_js = """
<script>
// PWA Install Banner Logic
(function() {
  var deferredPrompt = null;
  var banner = null;

  // Don't show if already dismissed recently (24h)
  var dismissed = localStorage.getItem('pwa_install_dismissed');
  if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    // Show banner after 2 seconds
    setTimeout(function() {
      banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'block';
    }, 2000);
  });

  window.triggerInstall = function() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(result) {
      if (result.outcome === 'accepted') {
        var b = document.getElementById('pwa-install-banner');
        if (b) b.style.display = 'none';
      }
      deferredPrompt = null;
    });
  };

  window.dismissInstallBanner = function() {
    var b = document.getElementById('pwa-install-banner');
    if (b) b.style.display = 'none';
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  // Hide banner once installed
  window.addEventListener('appinstalled', function() {
    var b = document.getElementById('pwa-install-banner');
    if (b) b.style.display = 'none';
  });
})();
</script>
"""

html = html.replace('</body>', install_html + install_js + '\n</body>', 1)

with open(r'C:\Users\sayefate\Desktop\naye-quran-pwa\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("DONE")
checks = [
    'pwa-install-banner',
    'pwa-btn-install',
    'pwa-btn-close',
    'beforeinstallprompt',
    'triggerInstall',
    'dismissInstallBanner',
    'appinstalled',
    '\u0646\u0635\u0628 \u06a9\u0646\u06cc\u062f',  # نصب کنید
    'pwa_install_dismissed',
]
for c in checks:
    print(f"  {'OK' if c in html else 'MISSING'}: {c}")
