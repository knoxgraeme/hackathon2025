// Pixieset Storyboard Extension - React-Ready Version
console.log('🎨 Pixieset Storyboard Extension loaded!');
console.log('Current URL:', window.location.href);

// Function to wait for element to exist
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkExist = setInterval(() => {
      const element = document.querySelector(selector);
      
      if (element) {
        clearInterval(checkExist);
        console.log(`✅ Found element: ${selector}`);
        resolve(element);
      }
      
      if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        console.log(`❌ Timeout waiting for: ${selector}`);
        reject(new Error(`Element ${selector} not found after ${timeout}ms`));
      }
    }, 100);
  });
}

// Main injection function
async function injectStoryboardButton() {
  console.log('🔍 Starting button injection process...');
  
  // Only inject on session detail pages
  if (!window.location.pathname.includes('/sessions/')) {
    console.log('❌ Not a session page, skipping injection');
    return;
  }

  // Check if button already exists
  if (document.getElementById('storyboard-header-btn')) {
    console.log('⚠️ Button already exists, skipping');
    return;
  }

  try {
    // First, wait for React to render the main content
    // Look for the session details or any button that indicates the page is loaded
    console.log('⏳ Waiting for React to render the page...');
    
    // Try multiple strategies to find the injection point
    let headerArea = null;
    
    // Strategy 1: Wait for "View Session" button and use its parent
    try {
      await waitForElement('button', 5000); // Wait for any button first
      
      // Now find the View Session button specifically
      const buttons = Array.from(document.querySelectorAll('button'));
      const viewSessionBtn = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('View Session')
      );
      
      if (viewSessionBtn) {
        console.log('✅ Found View Session button');
        headerArea = viewSessionBtn.parentElement;
        
        // Try to go up to find the actions container
        let parent = viewSessionBtn.parentElement;
        while (parent && parent.parentElement) {
          const classNames = parent.className || '';
          if (classNames.toLowerCase().includes('action') || 
              classNames.toLowerCase().includes('header') ||
              classNames.toLowerCase().includes('toolbar')) {
            headerArea = parent;
            break;
          }
          parent = parent.parentElement;
        }
      }
    } catch (e) {
      console.log('View Session button strategy failed:', e.message);
    }
    
    // Strategy 2: Look for the header/nav area by class patterns
    if (!headerArea) {
      const possibleSelectors = [
        '[class*="Actions"]',
        '[class*="actions"]',
        '[class*="Header"]',
        '[class*="header"]',
        '[class*="Toolbar"]',
        '[class*="toolbar"]',
        'header',
        'nav',
        '[role="navigation"]',
        '[role="toolbar"]'
      ];
      
      for (const selector of possibleSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element && element.querySelector('button')) {
            headerArea = element;
            console.log(`✅ Found header area with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }
    }
    
    // Strategy 3: Find any area with multiple buttons
    if (!headerArea) {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        const buttons = div.querySelectorAll('button');
        if (buttons.length >= 2 && buttons.length <= 10) {
          // Look for a div that has a reasonable number of buttons
          const hasViewSession = Array.from(buttons).some(btn => 
            btn.textContent && btn.textContent.includes('View Session')
          );
          if (hasViewSession) {
            headerArea = div;
            console.log('✅ Found header area by button count');
            break;
          }
        }
      }
    }
    
    if (!headerArea) {
      throw new Error('Could not find suitable injection point');
    }
    
    console.log('🎯 Injecting button into:', headerArea);
    
    // Create the button
    const storyboardBtn = document.createElement('button');
    storyboardBtn.id = 'storyboard-header-btn';
    
    // Try to match the style of existing buttons
    const existingButton = headerArea.querySelector('button');
    if (existingButton) {
      // Copy classes from existing button
      storyboardBtn.className = existingButton.className;
      console.log('Copying button classes:', existingButton.className);
    }
    
    // Add our custom class and ensure proper styling
    storyboardBtn.classList.add('storyboard-header-button');
    
    // Apply inline styles as backup
    storyboardBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background-color: #5BBFAF;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-right: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
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
    
    // Find the best position to insert the button
    const viewSessionBtn = Array.from(headerArea.querySelectorAll('button')).find(
      btn => btn.textContent && btn.textContent.includes('View Session')
    );
    
    if (viewSessionBtn) {
      // Insert before View Session button
      viewSessionBtn.parentElement.insertBefore(storyboardBtn, viewSessionBtn);
    } else {
      // Insert at the beginning of the header area
      headerArea.insertBefore(storyboardBtn, headerArea.firstChild);
    }
    
    console.log('✅ Button injection complete!');
    
  } catch (error) {
    console.error('❌ Failed to inject button:', error);
    
    // Retry after a delay
    setTimeout(() => {
      console.log('🔄 Retrying injection...');
      injectStoryboardButton();
    }, 2000);
  }
}

// Scrape session data
function scrapeSessionData() {
  console.log('🔍 Scraping session data...');
  const data = {};
  
  // Look for all table cells and divs
  const elements = [...document.querySelectorAll('td'), ...document.querySelectorAll('div')];
  
  // Method 1: Find by looking for labels and their adjacent values
  const findValueByLabel = (labelText) => {
    for (const element of elements) {
      if (element.textContent.trim().toLowerCase() === labelText.toLowerCase()) {
        const nextElement = element.nextElementSibling;
        if (nextElement) {
          return nextElement.textContent.trim();
        }
        // Check parent's next sibling (for table structure)
        const parentNext = element.parentElement?.nextElementSibling;
        if (parentNext) {
          const value = parentNext.querySelector('td, div');
          if (value) return value.textContent.trim();
        }
      }
    }
    return null;
  };
  
  // Method 2: Find in table rows
  const rows = document.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      
      if (label.includes('client')) {
        const link = cells[1].querySelector('a');
        data.client = link ? link.textContent.trim() : value;
      }
      if (label.includes('project')) {
        const link = cells[1].querySelector('a');
        data.project = link ? link.textContent.trim() : value;
      }
      if (label.includes('location')) {
        data.location = value === '-' ? '' : value;
      }
      if (label === 'date' || label.includes('date') && !label.includes('created')) {
        data.date = value;
      }
    }
  });
  
  // Method 3: Specific lookups
  if (!data.client) {
    // Look for "testing hello" anywhere on the page
    const testingHelloElement = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent === 'testing hello' && el.children.length === 0
    );
    if (testingHelloElement) {
      data.client = 'testing hello';
    }
  }
  
  if (!data.project) {
    // Look for "testing's Project"
    const projectElement = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent.includes("testing's Project") && el.children.length === 0
    );
    if (projectElement) {
      data.project = projectElement.textContent.trim();
    }
  }
  
  console.log('📋 Scraped data:', data);
  return data;
}

// Generate QR code
function generateQRCode() {
  console.log('🎨 Generating QR code...');
  const sessionData = scrapeSessionData();
  
  const baseUrl = 'https://hackathon2025-eta.vercel.app';
  const params = new URLSearchParams({
    client: sessionData.client || '',
    project: sessionData.project || '',
    location: sessionData.location || '',
    date: sessionData.date || ''
  });
  
  const fullUrl = `${baseUrl}?${params.toString()}`;
  console.log('Generated URL:', fullUrl);
  
  showQRModal(fullUrl, sessionData);
}

// Show QR modal
function showQRModal(url, sessionData) {
  // Remove existing modal if any
  const existingModal = document.getElementById('qr-modal');
  if (existingModal) existingModal.remove();

  // Create modal
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

// Copy to clipboard function
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

// Generate QR code image
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
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
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
    } else {
      // Fallback if QRCode library isn't loaded properly
      container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p><strong>QR Code URL:</strong></p>
          <p style="font-size: 12px; word-break: break-all; font-family: monospace;">${text}</p>
          <p style="margin-top: 10px; color: #666;">QR code library not loaded</p>
        </div>
      `;
    }
  };
  script.onerror = () => {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <p><strong>QR Code URL:</strong></p>
        <p style="font-size: 12px; word-break: break-all; font-family: monospace;">${text}</p>
        <p style="margin-top: 10px; color: #666;">Failed to load QR library</p>
      </div>
    `;
  };
  document.head.appendChild(script);
}

// Initialize extension
function initializeExtension() {
  console.log('🚀 Initializing extension...');
  
  // Wait a bit for React to start rendering
  setTimeout(() => {
    injectStoryboardButton();
  }, 2000);
  
  // Also set up a mutation observer for SPA navigation
  const observer = new MutationObserver((mutations) => {
    // Check if we're on a session page and button doesn't exist
    if (window.location.pathname.includes('/sessions/') && 
        !document.getElementById('storyboard-header-btn')) {
      console.log('📍 Navigation detected, checking for button...');
      
      // Debounce to avoid multiple injections
      clearTimeout(observer.debounceTimer);
      observer.debounceTimer = setTimeout(() => {
        injectStoryboardButton();
      }, 1000);
    }
  });
  
  // Start observing once the app div exists
  const appDiv = document.getElementById('app');
  if (appDiv) {
    observer.observe(appDiv, {
      childList: true,
      subtree: true
    });
    console.log('👀 Mutation observer started');
  } else {
    console.warn('App div not found, observer not started');
  }
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

console.log('🎨 Extension script loaded successfully!');