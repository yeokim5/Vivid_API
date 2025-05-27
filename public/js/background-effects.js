// Background effects initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM Content Loaded - preparing to initialize background effect");
  
  // Try multiple times with increasing delays
  tryInitializeEffect(500);
  tryInitializeEffect(1000);
  tryInitializeEffect(2000);
  tryInitializeEffect(3000);
});

/**
 * Try to initialize the background effect with a delay
 */
function tryInitializeEffect(delay) {
  setTimeout(() => {
    console.log(`Attempting to initialize background effect after ${delay}ms delay`);
    if (typeof backgroundEffect !== 'undefined') {
      initBackgroundEffect(backgroundEffect);
    } else {
      console.log("Background effect variable not found, trying from window object");
      if (window.essayBackgroundEffect) {
        initBackgroundEffect(window.essayBackgroundEffect);
      }
    }
  }, delay);
}

/**
 * Initialize the selected background effect
 * @param {string} effectType - The type of effect to initialize
 */
function initBackgroundEffect(effectType) {
  if (!effectType || effectType === 'none') {
    console.log("No background effect selected or 'none' specified");
    return;
  }
  
  console.log("Creating background effect:", effectType);
  
  // Remove any existing effect containers
  const existingEffects = document.querySelectorAll('.background-effect-container');
  existingEffects.forEach(el => {
    console.log("Removing existing effect container");
    el.remove();
  });
  
  // Create the effect container
  const effectContainer = document.createElement('div');
  effectContainer.className = 'background-effect-container';
  effectContainer.id = 'background-effect-container';
  
  // Force apply styles directly to ensure visibility
  effectContainer.style.position = 'fixed';
  effectContainer.style.top = '0';
  effectContainer.style.left = '0';
  effectContainer.style.width = '100%';
  effectContainer.style.height = '100%';
  effectContainer.style.pointerEvents = 'none';
  effectContainer.style.zIndex = '5'; // Higher than bg but lower than content
  effectContainer.style.overflow = 'hidden';
  
  // Add specific effect implementation
  switch (effectType) {
    case 'blob':
      createBlobEffect(effectContainer);
      break;
    case 'firefly':
      createFireflyEffect(effectContainer);
      break;
    case 'particles':
      createParticlesEffect(effectContainer);
      break;
    case 'gradient':
      createGradientEffect(effectContainer);
      break;
    default:
      console.log("Unknown effect type:", effectType);
      return;
  }
  
  // Add the effect container to the body
  document.body.appendChild(effectContainer);
  
  // Log to confirm effect was added to the DOM
  console.log(`Background effect '${effectType}' was added to the DOM`);
  
  // Force a reflow to ensure the effect is rendered
  void effectContainer.offsetWidth;
  
  // Double check z-index hierarchy
  fixZIndexHierarchy();
}

/**
 * Fix z-index hierarchy to ensure proper layering
 */
function fixZIndexHierarchy() {
  console.log("Fixing z-index hierarchy");
  
  // Set z-index for background elements
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  parallaxBgs.forEach(bg => {
    bg.style.zIndex = '1';
    bg.style.position = 'absolute';
  });
  
  // Set z-index for overlay elements
  const bgOverlays = document.querySelectorAll('.bg-overlay');
  bgOverlays.forEach(overlay => {
    overlay.style.zIndex = '2';
    overlay.style.position = 'absolute';
  });
  
  // Set z-index for content elements
  const quotes = document.querySelectorAll('.quote');
  quotes.forEach(quote => {
    quote.style.zIndex = '10';
    quote.style.position = 'relative';
  });
  
  // Ensure header elements are above background
  const headerElements = document.querySelectorAll('header h1, header h2, .author');
  headerElements.forEach(el => {
    el.style.zIndex = '10';
    el.style.position = 'relative';
  });
}

/**
 * Create a blob animation with glassmorphism effect
 * @param {HTMLElement} container - The container element
 */
function createBlobEffect(container) {
  // Create a style element for the blob effect
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .background-effect-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 5 !important;
      overflow: hidden !important;
      backdrop-filter: blur(12px) !important;
    }
    
    .blob {
      position: absolute !important;
      border-radius: 50% !important;
      filter: blur(60px) !important;
      opacity: 0.8 !important;
      animation: blob-float 15s infinite !important;
    }
    
    @keyframes blob-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(80px, 80px) scale(1.5); }
      50% { transform: translate(160px, -80px) scale(1.2); }
      75% { transform: translate(-80px, 80px) scale(1.4); }
    }
  `;
  
  // Add the style element to the container
  container.appendChild(styleElement);
  
  // Create multiple blobs with different colors, sizes, and positions
  const colors = [
    'rgba(255, 94, 98, 0.95)', 
    'rgba(255, 153, 102, 0.95)', 
    'rgba(110, 72, 170, 0.95)', 
    'rgba(157, 80, 187, 0.95)',
    'rgba(0, 201, 255, 0.95)'
  ];
  
  for (let i = 0; i < 8; i++) {
    const blob = document.createElement('div');
    blob.className = 'blob';
    
    // Randomize blob properties
    const size = Math.random() * 400 + 200;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * -20;
    const duration = Math.random() * 10 + 12;
    
    blob.style.cssText = `
      width: ${size}px !important;
      height: ${size}px !important;
      left: ${left}% !important;
      top: ${top}% !important;
      background: ${colors[i % colors.length]} !important;
      animation-delay: ${delay}s !important;
      animation-duration: ${duration}s !important;
      position: absolute !important;
      border-radius: 50% !important;
      filter: blur(60px) !important;
      opacity: 0.8 !important;
    `;
    
    container.appendChild(blob);
  }
}

/**
 * Create a firefly-like particles effect
 * @param {HTMLElement} container - The container element
 */
function createFireflyEffect(container) {
  // Create a style element for the firefly effect
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .background-effect-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 5 !important;
      overflow: hidden !important;
    }
    
    .firefly {
      position: absolute !important;
      width: 5px !important;
      height: 5px !important;
      border-radius: 50% !important;
      background: #fff !important;
      box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.9) !important;
      opacity: 0 !important;
      animation: firefly linear infinite !important;
    }
    
    @keyframes firefly {
      0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.2); }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-150px) translateX(150px) scale(1.5); }
    }
  `;
  
  // Add the style element to the container
  container.appendChild(styleElement);
  
  // Create multiple fireflies
  for (let i = 0; i < 150; i++) {
    const firefly = document.createElement('div');
    firefly.className = 'firefly';
    
    // Randomize firefly properties
    const size = Math.random() * 4 + 3;
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const duration = Math.random() * 6 + 4;
    const delay = Math.random() * -10;
    
    firefly.style.cssText = `
      width: ${size}px !important;
      height: ${size}px !important;
      left: ${left}% !important;
      top: ${top}% !important;
      animation-duration: ${duration}s !important;
      animation-delay: ${delay}s !important;
      position: absolute !important;
      border-radius: 50% !important;
      opacity: 0 !important;
    `;
    
    // Alternate between yellow and white for more realistic firefly effect
    if (i % 2 === 0) {
      firefly.style.background = '#ffbb00 !important';
      firefly.style.boxShadow = '0 0 25px 8px rgba(255, 187, 0, 0.95) !important';
    } else {
      firefly.style.background = '#ffffff !important';
      firefly.style.boxShadow = '0 0 25px 8px rgba(255, 255, 255, 0.95) !important';
    }
    
    container.appendChild(firefly);
  }
}

/**
 * Create a floating particles effect
 * @param {HTMLElement} container - The container element
 */
function createParticlesEffect(container) {
  // Create a style element for the particles effect
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .background-effect-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 5 !important;
      overflow: hidden !important;
    }
    
    .particle {
      position: absolute !important;
      border-radius: 50% !important;
      opacity: 0.9 !important;
      animation: float linear infinite !important;
      bottom: -20px !important;
    }
    
    @keyframes float {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 0.9; }
      90% { opacity: 0.9; }
      100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }
  `;
  
  // Add the style element to the container
  container.appendChild(styleElement);
  
  // Particle colors
  const colors = [
    '#ffffff', // White
    '#7f7fd5', // Purple
    '#86a8e7', // Blue
    '#91eae4'  // Cyan
  ];
  
  // Create multiple particles
  for (let i = 0; i < 150; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Randomize particle properties
    const size = Math.random() * 8 + 3;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * -20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
      width: ${size}px !important;
      height: ${size}px !important;
      left: ${left}% !important;
      background: ${color} !important;
      box-shadow: 0 0 20px 5px ${color} !important;
      animation-duration: ${duration}s !important;
      animation-delay: ${delay}s !important;
      position: absolute !important;
      border-radius: 50% !important;
      opacity: 0.9 !important;
    `;
    
    container.appendChild(particle);
  }
}

/**
 * Create a gradient/aurora animation
 * @param {HTMLElement} container - The container element
 */
function createGradientEffect(container) {
  // Create a style element for the gradient effect
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .background-effect-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: 5 !important;
      overflow: hidden !important;
    }
    
    .gradient-bg {
      position: absolute !important;
      top: -50% !important;
      left: -50% !important;
      width: 200% !important;
      height: 200% !important;
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab) !important;
      background-size: 300% 300% !important;
      opacity: 0.9 !important;
      animation: gradient 8s ease infinite !important;
    }
    
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  
  // Add the style element to the container
  container.appendChild(styleElement);
  
  const gradientBg = document.createElement('div');
  gradientBg.className = 'gradient-bg';
  container.appendChild(gradientBg);
} 