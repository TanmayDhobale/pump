export const formatNumber = (value: number | { toNumber: () => number }): string => {
  const num = typeof value === 'number' ? value : value.toNumber();
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}; 