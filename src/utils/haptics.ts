/**
 * Utility for triggering haptic feedback via the Vibration API.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'combo') {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([40, 40, 40]);
          break;
        case 'error':
          navigator.vibrate([80, 50, 80]);
          break;
        case 'combo':
          navigator.vibrate([30, 20, 30, 20, 50]);
          break;
        default:
          navigator.vibrate(20);
      }
    } catch (e) {
      // Vibration API is often blocked by permissions/iframe in dev environments
      console.log('Haptic skipped:', type);
    }
  }
}
