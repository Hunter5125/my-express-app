// Quick test to verify the signatureImg helper output
const hbs = require('hbs');

// Register the helper exactly as in app.js
hbs.registerHelper('signatureImg', function(signature) {
  if (!signature) {
    console.log('🔴 signatureImg helper called with empty signature');
    return new hbs.SafeString('');
  }
  console.log('✅ signatureImg helper called');
  
  // Create the img tag with proper escaping
  const escaped = signature.toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const html = `<img src="${escaped}" alt="Signature" style="max-width: 95%; max-height: 90px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">`;
  console.log('Generated HTML first 200 chars:');
  console.log(html.substring(0, 200));
  return new hbs.SafeString(html);
});

// Test with a data URL
const testDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA==';

// Simulate Handlebars calling the helper
const result = hbs.helpers.signatureImg(testDataURL);

console.log('\n✅ Result type:', result.constructor.name);
console.log('✅ Result is string:', typeof result.string === 'string');
console.log('✅ First 150 chars:', result.string.substring(0, 150));

// Verify the data URL is not escaped in the output
const hasDataURL = result.string.includes('data:image/png');
console.log('\n' + (hasDataURL ? '✅' : '❌') + ' Data URL present in output:', hasDataURL);

const hasEscapedColon = result.string.includes('data%3A');
console.log(hasEscapedColon ? '❌' : '✅' + ' Data URL NOT escaped in output');
