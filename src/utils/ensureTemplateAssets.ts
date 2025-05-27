import fs from 'fs';
import path from 'path';

/**
 * Ensures that the necessary directories for template assets exist
 */
export function ensureTemplateAssets() {
  const frontPublicPath = path.join(__dirname, '../../../front/public');
  const stylesPath = path.join(frontPublicPath, 'styles');
  const jsPath = path.join(frontPublicPath, 'js');
  
  // Create directories if they don't exist
  if (!fs.existsSync(frontPublicPath)) {
    console.log('Creating front/public directory');
    fs.mkdirSync(frontPublicPath, { recursive: true });
  }
  
  if (!fs.existsSync(stylesPath)) {
    console.log('Creating front/public/styles directory');
    fs.mkdirSync(stylesPath, { recursive: true });
  }
  
  if (!fs.existsSync(jsPath)) {
    console.log('Creating front/public/js directory');
    fs.mkdirSync(jsPath, { recursive: true });
  }
  
  // Check if the CSS file exists
  const cssFilePath = path.join(stylesPath, 'essay-template.css');
  if (!fs.existsSync(cssFilePath)) {
    console.warn('Warning: CSS file does not exist at', cssFilePath);
    console.warn('Please create this file with the essay template styles');
  }
  
  // Check if the JS file exists
  const jsFilePath = path.join(jsPath, 'essay-template.js');
  if (!fs.existsSync(jsFilePath)) {
    console.warn('Warning: JavaScript file does not exist at', jsFilePath);
    console.warn('Please create this file with the essay template scripts');
  }
}

export default ensureTemplateAssets; 