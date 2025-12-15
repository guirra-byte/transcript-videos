export const rateLimiter = (interval = 0.5 * 60 * 1000) => {
  let lastInvocation;
  return () => {
    if (!lastInvocation) {
      lastInvocation = Date.now();
      return true;
    }

    if (Date.now() - lastInvocation < interval) return false;
    return true;
  };
}