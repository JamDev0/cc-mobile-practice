"use client";

import { useCallback } from "react";
import type { HapticInput, TriggerOptions } from "web-haptics";
import { useWebHaptics } from "web-haptics/react";

const HAPTIC_INTENSITY = {
  success: 0.7,
  selection: 0.45,
  destructiveConfirm: 0.8,
} as const;

export function useAppHaptics() {
  const { trigger, isSupported } = useWebHaptics();

  const play = useCallback(
    (input: HapticInput, options?: TriggerOptions) => {
      if (!isSupported) return;
      void trigger(input, options);
    },
    [isSupported, trigger]
  );

  const selection = useCallback(() => {
    play("selection", { intensity: HAPTIC_INTENSITY.selection });
  }, [play]);

  const success = useCallback(() => {
    play("success", { intensity: HAPTIC_INTENSITY.success });
  }, [play]);

  const destructiveConfirm = useCallback(() => {
    play("warning", { intensity: HAPTIC_INTENSITY.destructiveConfirm });
  }, [play]);

  return {
    selection,
    success,
    destructiveConfirm,
  };
}
