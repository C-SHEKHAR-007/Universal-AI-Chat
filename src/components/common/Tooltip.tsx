import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  Animated,
} from 'react-native';

import { TOOLTIP_CONFIG } from '../../constants';

interface TooltipProps {
  text: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'left' | 'right';
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  delay = TOOLTIP_CONFIG.DEFAULT_DELAY_MS,
  position = 'bottom',
  align = 'center',
  children,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<any>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const showTooltip = () => {
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setVisible(false);
    });
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(showTooltip, delay);
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const getPositionStyle = (): ViewStyle => {
    const posStyle: ViewStyle = {};

    if (position === 'top') {
      posStyle.bottom = '100%' as `${number}%`;
      posStyle.marginBottom = 6;
    } else if (position === 'left') {
      posStyle.right = '100%' as `${number}%`;
      posStyle.marginRight = 6;
      posStyle.top = '50%' as `${number}%`;
      posStyle.transform = [{ translateY: -12 }];
      return posStyle;
    } else if (position === 'right') {
      posStyle.left = '100%' as `${number}%`;
      posStyle.marginLeft = 6;
      posStyle.top = '50%' as `${number}%`;
      posStyle.transform = [{ translateY: -12 }];
      return posStyle;
    } else {
      // bottom
      posStyle.top = '100%' as `${number}%`;
      posStyle.marginTop = 6;
    }

    // Horizontal alignment for top/bottom positions
    if (align === 'right') {
      posStyle.right = 0;
    } else if (align === 'left') {
      posStyle.left = 0;
    } else {
      posStyle.alignSelf = 'center';
      // Center horizontally relative to parent
      posStyle.left = '50%' as `${number}%`;
      posStyle.transform = [{ translateX: -50 }];
    }

    return posStyle;
  };

  // On web, attach mouse enter & leave listeners
  const webHoverProps = Platform.OS === 'web'
    ? {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        // @ts-ignore - web accessibility
        title: text,
      }
    : {};

  return (
    <View
      style={[styles.wrapper, style]}
      {...webHoverProps}
    >
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.tooltipBubble,
            getPositionStyle(),
            { opacity },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipText} numberOfLines={1}>
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  tooltipBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 99999,
    minWidth: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  tooltipText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : {}),
  },
});
