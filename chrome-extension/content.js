// Wait for page to load
setTimeout(() => {
    injectStoryboardButton();
  }, 2000);
  
  // Monitor for page changes (in case of SPA navigation)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('storyboard-header-btn')) {
      injectStoryboardButton();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  function injectStoryboardButton() {
    // Only inject on session detail pages
    if (!window.location.pathname.includes('/sessions/')) return;
  
    // Find the header area - looking for the toolbar with other buttons
    const headerToolbar = document.querySelector('[class*="Toolbar"]') || 
                         document.querySelector('.toolbar') ||
                         document.querySelector('header nav') ||
                         document.querySelector('[role="toolbar"]');
    
    if (!headerToolbar) {
      console.log('Header toolbar not found, retrying...');
      setTimeout(injectStoryboardButton, 1000);
      return;
    }
  
    // Check if button already exists
    if (document.getElementById('storyboard-header-btn')) return;
  
    // Create button container to match the existing button groups
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'storyboard-btn-container';
    
    // Create the button matching Pixieset's style
    const storyboardBtn = document.createElement('button');
    storyboardBtn.id = 'storyboard-header-btn';
    storyboardBtn.className = 'storyboard-header-button';
    storyboardBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      Generate Storyboard
    `;
    storyboardBtn.onclick = generateQRCode;
  
    buttonContainer.appendChild(storyboardBtn);
    
    // Try to insert in a good position in the header
    const rightSection = headerToolbar.querySelector('[class*="right"]') || 
                        headerToolbar.querySelector('[class*="actions"]') ||
                        headerToolbar;
    
    if (rightSection.firstChild) {
      rightSection.insertBefore(buttonContainer, rightSection.firstChild);
    } else {
      rightSection.appendChild(buttonContainer);
    }
  }
  
  function scrapeSessionData() {
    const data = {};
    
    // Method 1: Try to find data in the Session Details section
    const detailsSection = Array.from(document.querySelectorAll('h2, h3')).find(
      el => el.textContent.includes('Session Details')
    );
    
    if (detailsSection) {
      const detailsContainer = detailsSection.nextElementSibling || detailsSection.parentElement;
      const rows = detailsContainer.querySelectorAll('tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          
          if (label.toLowerCase().includes('client')) {
            // Follow the link if it exists
            const link = cells[1].querySelector('a');
            data.client = link ? link.textContent.trim() : value;
          }
          if (label.toLowerCase().includes('project')) {
            const link = cells[1].querySelector('a');
            data.project = link ? link.textContent.trim() : value;
          }
          if (label.toLowerCase().includes('location')) {
            data.location = value === '-' ? '' : value;
          }
          if (label.toLowerCase() === 'date') {
            data.date = value;
          }
        }
      });
    }
    
    // Method 2: Try the summary section at the top
    if (!data.client) {
      // Look for "testing hello" in the main content
      const clientCells = Array.from(document.querySelectorAll('td')).filter(
        td => td.textContent.includes('testing hello')
      );
      if (clientCells.length > 0) {
        data.client = 'testing hello';
      }
    }
    
    // Method 3: Look for specific text patterns
    if (!data.date) {
      const datePattern = /\w+,\s+\w+\s+\d{1,2}(st|nd|rd|th)?,\s+\d{4}/;
      const dateElements = Array.from(document.querySelectorAll('td, div')).filter(
        el => datePattern.test(el.textContent)
      );
      if (dateElements.length > 0) {
        data.date = dateElements[0].textContent.match(datePattern)[0];
      }
    }
  
    console.log('Scraped data:', data);
    return data;
  }
  
  function generateQRCode() {
    const sessionData = scrapeSessionData();
    
    // Hackathon 2025 Storyboard URL
    const baseUrl = 'https://hackathon2025-eta.vercel.app';
    const params = new URLSearchParams({
      client: sessionData.client || '',
      project: sessionData.project || '',
      location: sessionData.location || '',
      date: sessionData.date || ''
    });
    
    const fullUrl = `${baseUrl}?${params.toString()}`;
    console.log('Generated URL:', fullUrl);
    
    // Create modal for QR code
    showQRModal(fullUrl, sessionData);
  }
  
  function showQRModal(url, sessionData) {
    // Remove existing modal if any
    const existingModal = document.getElementById('qr-modal');
    if (existingModal) existingModal.remove();
  
    // Create modal with Pixieset-style design
    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'qr-modal';
    modal.innerHTML = `
      <div class="qr-modal-content">
        <div class="qr-modal-header">
          <h2>Storyboard QR Code</h2>
          <button class="qr-close-btn">&times;</button>
        </div>
        <div class="qr-modal-body">
          <div id="qr-code-container"></div>
          <div class="qr-details">
            <h3>Session Details</h3>
            <div class="qr-detail-item">
              <span class="qr-detail-label">Client:</span>
              <span class="qr-detail-value">${sessionData.client || 'N/A'}</span>
            </div>
            <div class="qr-detail-item">
              <span class="qr-detail-label">Project:</span>
              <span class="qr-detail-value">${sessionData.project || 'N/A'}</span>
            </div>
            <div class="qr-detail-item">
              <span class="qr-detail-label">Location:</span>
              <span class="qr-detail-value">${sessionData.location || 'N/A'}</span>
            </div>
            <div class="qr-detail-item">
              <span class="qr-detail-label">Date:</span>
              <span class="qr-detail-value">${sessionData.date || 'N/A'}</span>
            </div>
          </div>
          <div class="qr-url-section">
            <input type="text" class="qr-url-input" value="${url}" readonly>
            <button class="qr-copy-btn" onclick="copyToClipboard('${url}', this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy URL
            </button>
          </div>
        </div>
      </div>
    `;
  
    document.body.appendChild(modal);
  
    // Generate QR code
    generateQRCodeImage(url, document.getElementById('qr-code-container'));
  
    // Close modal handlers
    const closeBtn = modal.querySelector('.qr-close-btn');
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    
    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }
  
  // Add copy function to window for onclick
  window.copyToClipboard = function(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied!
      `;
      button.classList.add('copied');
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('copied');
      }, 2000);
    });
  };
  
  function generateQRCodeImage(text, container) {
    // Create a canvas for the QR code
    const canvas = document.createElement('canvas');
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code-wrapper';
    qrContainer.appendChild(canvas);
    container.appendChild(qrContainer);
  
    // Load QR library and generate code
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('qrcode.min.js');
    script.onload = () => {
      QRCode.toCanvas(canvas, text, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error(error);
      });
    };
    document.head.appendChild(script);
  }