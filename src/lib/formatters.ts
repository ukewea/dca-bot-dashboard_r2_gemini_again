export function formatCurrency(value: string | number, currency: string = 'USD') {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Intl.NumberFormat's 'currency' style fails with non-ISO 4217 codes like 'USDC'.
  // We'll format these as a decimal and append the code as a string.
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (e) {
    if (e instanceof RangeError) {
      // Fallback for non-standard currency codes.
      return `${numericValue.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })} ${currency}`;
    }
    // Re-throw other unexpected errors.
    throw e;
  }
}

export function formatDateTime(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(dateString));
}

export function formatNumber(value: string | number) {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8, // For crypto quantities
    }).format(numericValue);
}
