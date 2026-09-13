import React from 'react';
import { DotWaveLoader } from './DotWaveLoader';
import { SkeletonShimmerLoader } from './SkeletonShimmerLoader';
import { SparkleOrbLoader } from './SparkleOrbLoader';
import { ReasoningTimerLoader } from './ReasoningTimerLoader';
import { GradientPulseLoader } from './GradientPulseLoader';
import { BaseLoaderProps, LoadingStyle } from './types';

export * from './types';
export * from './DotWaveLoader';
export * from './SkeletonShimmerLoader';
export * from './SparkleOrbLoader';
export * from './ReasoningTimerLoader';
export * from './GradientPulseLoader';

/**
 * Extensible loader registry mapping:
 * To add a new loader variant in the future, simply create a new LoaderComponent
 * and register it here with its key!
 */
export const LOADING_VARIANTS: Record<LoadingStyle, React.FC<BaseLoaderProps>> = {
  dot_wave: DotWaveLoader,
  skeleton_shimmer: SkeletonShimmerLoader,
  sparkle_orb: SparkleOrbLoader,
  reasoning_timer: ReasoningTimerLoader,
  gradient_pulse: GradientPulseLoader,
};

export const LOADING_STYLES: LoadingStyle[] = Object.keys(LOADING_VARIANTS) as LoadingStyle[];

export const getLoadingStyleForConversation = (conversationId?: string): LoadingStyle => {
  if (!conversationId) return 'dot_wave';
  let hash = 0;
  for (let i = 0; i < conversationId.length; i++) {
    hash = (hash << 5) - hash + conversationId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % LOADING_STYLES.length;
  return LOADING_STYLES[index];
};
