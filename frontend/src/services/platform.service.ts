export type PlatformType = 'web' | 'android' | 'ios' | 'native_mobile';

class PlatformService {
  public getPlatform(): PlatformType {
    if (typeof window === 'undefined') return 'web';
    const win = window as any;

    // Check for Capacitor native platform
    if (win.Capacitor?.isNative) {
      if (win.Capacitor.platform === 'ios') return 'ios';
      if (win.Capacitor.platform === 'android') return 'android';
      return 'native_mobile';
    }

    // Check Cordova
    if (win.cordova) {
      const platformId = win.cordova.platformId;
      if (platformId === 'ios') return 'ios';
      if (platformId === 'android') return 'android';
      return 'native_mobile';
    }

    // User agent check for standalone/native wrappers or custom simulation
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('capacitor') || ua.includes('cordova')) {
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
      if (ua.includes('android')) return 'android';
      return 'native_mobile';
    }

    // Check query params for easy debugging/testing on browser
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    if (platformParam === 'mobile' || platformParam === 'native') {
      return 'native_mobile';
    }
    if (platformParam === 'ios') return 'ios';
    if (platformParam === 'android') return 'android';

    return 'web';
  }

  public isNativeMobile(): boolean {
    const platform = this.getPlatform();
    return platform === 'android' || platform === 'ios' || platform === 'native_mobile';
  }

  public isWeb(): boolean {
    return this.getPlatform() === 'web';
  }
}

export const platformService = new PlatformService();
export default platformService;
