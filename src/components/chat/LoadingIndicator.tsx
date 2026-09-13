import React from 'react';
import {
  LoadingStyle,
  LOADING_VARIANTS,
  LOADING_STYLES,
  getLoadingStyleForConversation,
  DotWaveLoader,
} from '../loaders';

export {
  LoadingStyle,
  LOADING_VARIANTS,
  LOADING_STYLES,
  getLoadingStyleForConversation,
};

export interface LoadingIndicatorProps {
  styleType?: LoadingStyle;
  conversationId?: string;
  modelName?: string;
}

/**
 * Universal Loading Indicator
 * Dynamically resolves the active loading variant component from the registry.
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  styleType,
  conversationId,
  modelName,
}) => {
  // Consistent static style for this specific conversation, randomized across different conversations
  const activeStyle: LoadingStyle =
    styleType || (conversationId ? getLoadingStyleForConversation(conversationId) : 'dot_wave');

  const LoaderComponent = LOADING_VARIANTS[activeStyle] || DotWaveLoader;

  return <LoaderComponent modelName={modelName} />;
};
