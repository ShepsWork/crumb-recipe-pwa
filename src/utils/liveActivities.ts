import { isNativePlatform } from './nativeLocalNotifications';

export type TimerLiveActivityInput = {
  recipeTitle: string;
  stepIndex: number;
  stepText: string;
  endTimeMs: number;
  widgetUrl: string;
};

export async function startTimerLiveActivity(input: TimerLiveActivityInput): Promise<string | null> {
  // NOTE:
  // We previously used the third-party `capacitor-live-activities` plugin here.
  // That plugin currently targets Capacitor 7 (capacitor-swift-pm 7.x), but this
  // app is on Capacitor 8 (capacitor-swift-pm 8.x). Mixing them breaks Swift
  // Package resolution in Xcode (and shows up as “Missing package product
  // 'CapApp-SPM'”).
  //
  // For now we no-op so the app builds and native local notifications work.
  // Next step (when we're ready) is to add a first-party ActivityKit widget
  // extension + small native bridge.
  void input;
  if (!isNativePlatform()) return null;
  return null;
}

export async function endTimerLiveActivity(activityId: string): Promise<void> {
  void activityId;
  if (!isNativePlatform()) return;
}
