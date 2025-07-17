// Pixieset Storyboard Extension v2.0 - Fresh Start
console.log('🚀 Pixieset Storyboard Extension v2.0 Starting...');

// Global variable to track if button is injected
let buttonInjected = false;

// Wait for element helper
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);
  });
}

// Inject button function
async function injectButton() {
  // Check URL
  if (!window.location.pathname.includes('/sessions/')) {
    console.log('❌ Not a session page');
    return;
  }

  if (buttonInjected) {
    console.log('✅ Button already injected');
    return;
  }

  console.log('🔍 Looking for Actions button...');

  try {
    // Wait for any button to appear first (indicates React has rendered)
    await waitForElement('button');
    
    // Small delay to ensure all buttons are rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the Actions button specifically
    const buttons = Array.from(document.querySelectorAll('button'));
    let actionsButton = buttons.find(btn => 
      btn.textContent && btn.textContent.trim() === 'Actions'
    );
    
    if (!actionsButton) {
      console.log('❌ Actions button not found');
      setTimeout(() => injectButton(), 2000);
      return;
    }
    
    console.log('✅ Found Actions button');
    
    // Get the parent container that holds all the buttons
    let buttonContainer = actionsButton.parentElement;
    
    // If Actions is in its own div, go up one more level to find the row container
    while (buttonContainer && buttonContainer.children.length === 1) {
      buttonContainer = buttonContainer.parentElement;
    }
    
    console.log('📦 Button container:', buttonContainer);
    
    // Create a wrapper div for our button to match the structure
    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-right: 8px;
    `;
    
    // Create our button
    const storyboardBtn = document.createElement('button');
    storyboardBtn.id = 'storyboard-btn-v2';
    storyboardBtn.className = actionsButton.className || '';
    storyboardBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background-color: transparent;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.2s ease;
      height: 100%;
      white-space: nowrap;
    `;
    
    storyboardBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      Generate Storyboard
    `;
    
    // Add click handler
    storyboardBtn.addEventListener('click', handleButtonClick);
    
    // Add hover effects
    storyboardBtn.addEventListener('mouseenter', () => {
      storyboardBtn.style.backgroundColor = '#f9fafb';
      storyboardBtn.style.borderColor = '#9ca3af';
    });
    
    storyboardBtn.addEventListener('mouseleave', () => {
      storyboardBtn.style.backgroundColor = 'transparent';
      storyboardBtn.style.borderColor = '#d1d5db';
    });
    
    // Add button to wrapper
    buttonWrapper.appendChild(storyboardBtn);
    
    // Find where to insert - look for Actions button's parent div
    const actionsWrapper = actionsButton.parentElement;
    
    // Insert our button wrapper before the Actions wrapper
    if (actionsWrapper && actionsWrapper.parentElement) {
      actionsWrapper.parentElement.insertBefore(buttonWrapper, actionsWrapper);
    } else {
      // Fallback: insert before Actions button directly
      actionsButton.parentNode.insertBefore(buttonWrapper, actionsButton);
    }
    
    buttonInjected = true;
    console.log('✅ Button injected successfully!');
    
  } catch (error) {
    console.error('❌ Error injecting button:', error);
    setTimeout(() => injectButton(), 2000);
  }
}

// Handle button click
function handleButtonClick() {
  console.log('🎯 Button clicked!');
  const data = scrapeData();
  const url = buildUrl(data);
  showModal(url, data);
}

// Scrape session data
function scrapeData() {
  console.log('📋 Scraping data...');
  const data = {
    client: '',
    project: '', 
    location: '',
    date: ''
  };
  
  // Find all table rows
  const rows = document.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      const label = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      
      if (label.includes('client')) {
        data.client = value;
      } else if (label.includes('project')) {
        data.project = value;
      } else if (label.includes('location')) {
        data.location = value === '-' ? '' : value;
      } else if (label === 'date') {
        data.date = value;
      }
    }
  });
  
  // Look for specific values if not found
  if (!data.client) {
    const clientEl = Array.from(document.querySelectorAll('*')).find(
      el => el.textContent === 'testing hello' && !el.children.length
    );
    if (clientEl) data.client = 'testing hello';
  }
  
  console.log('📋 Scraped data:', data);
  return data;
}

// Build URL
function buildUrl(data) {
  const baseUrl = 'https://hackathon2025-eta.vercel.app';
  const params = new URLSearchParams({
    client: data.client,
    project: data.project,
    location: data.location,
    date: data.date
  });
  return `${baseUrl}?${params.toString()}`;
}

// Show modal
function showModal(url, data) {
  // Remove existing modal
  const existing = document.getElementById('storyboard-modal-v2');
  if (existing) existing.remove();
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'storyboard-modal-v2';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  `;
  
  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Storyboard QR Code</h2>
      <button id="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
    </div>
    
    <div id="qr-container" style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;"></div>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #6b7280;">SESSION DETAILS</h3>
      <div style="font-size: 14px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Client:</span>
          <span>${data.client || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Project:</span>
          <span>${data.project || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="color: #6b7280;">Location:</span>
          <span>${data.location || 'N/A'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Date:</span>
          <span>${data.date || 'N/A'}</span>
        </div>
      </div>
    </div>
    
    <div style="display: flex; gap: 8px; align-items: center;">
      <input type="text" value="${url}" readonly style="flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 13px; background: #f9fafb;">
      <button id="copy-url" style="padding: 10px 16px; background: #5BBFAF; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Copy URL</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Generate QR code
  const qrContainer = document.getElementById('qr-container');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`;
  qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width: 256px; height: 256px;">`;
  
  // Event handlers
  document.getElementById('close-modal').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  document.getElementById('copy-url').addEventListener('click', () => {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copy-url');
      btn.textContent = 'Copied!';
      btn.style.background = '#10b981';
      setTimeout(() => {
        btn.textContent = 'Copy URL';
        btn.style.background = '#5BBFAF';
      }, 2000);
    });
  });
}

// Initialize
function initialize() {
  console.log('🎬 Initializing extension...');
  
  // Initial injection attempt
  setTimeout(() => {
    injectButton();
  }, 3000);
  
  // Monitor for navigation changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      buttonInjected = false;
      console.log('📍 Navigation detected, reinitializing...');
      setTimeout(() => injectButton(), 2000);
    }
  }).observe(document, { subtree: true, childList: true });
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

console.log('✅ Extension loaded successfully!');