import React, { useRef, useState } from 'react';
import { View, PanResponder, LayoutChangeEvent } from 'react-native';

interface TouchSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  accentColor?: string;
  className?: string;
  testID?: string;
}

export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  accentColor = '#0B84FE',
  className = '',
  testID,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);

  // Keep a mutable ref of latest props & track width so PanResponder handlers never have stale closures
  const latestRef = useRef({
    min,
    max,
    step,
    onChange,
    trackWidth: 0,
  });

  latestRef.current = {
    min,
    max,
    step,
    onChange,
    trackWidth: trackWidthRef.current || trackWidth,
  };

  const updateValueFromPosition = (x: number) => {
    const { min: currentMin, max: currentMax, step: currentStep, onChange: currentOnChange, trackWidth: w } =
      latestRef.current;
    if (w <= 0) return;

    const clampedX = Math.max(0, Math.min(w, x));
    const ratio = clampedX / w;
    const rawVal = currentMin + ratio * (currentMax - currentMin);
    const stepped = Math.round(rawVal / currentStep) * currentStep;
    const clamped = Math.max(currentMin, Math.min(currentMax, stepped));
    currentOnChange(clamped);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 4;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => false,

      onPanResponderGrant: (evt) => {
        startXRef.current = evt.nativeEvent.locationX;
        updateValueFromPosition(startXRef.current);
      },

      onPanResponderMove: (evt, gestureState) => {
        updateValueFromPosition(startXRef.current + gestureState.dx);
      },

      onPanResponderRelease: (evt, gestureState) => {
        updateValueFromPosition(startXRef.current + gestureState.dx);
      },

      onPanResponderTerminate: () => {
        // Cleanly handle termination without deadlocking the gesture responder system
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    trackWidthRef.current = w;
    latestRef.current.trackWidth = w;
  };

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      {...panResponder.panHandlers}
      className={`h-11 justify-center cursor-pointer ${className}`}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
    >
      {/* Background Track - pointerEvents="none" ensures touches go to the slider container */}
      <View
        pointerEvents="none"
        className="h-3 w-full bg-surfaceElevated rounded-full overflow-hidden border border-border/40"
      >
        {/* Filled Track */}
        <View
          style={{
            width: `${percentage}%`,
            backgroundColor: accentColor,
            height: '100%',
          }}
          className="rounded-full"
        />
      </View>

      {/* Thumb Indicator */}
      <View
        pointerEvents="none"
        style={{
          left: `${percentage}%`,
          marginLeft: -14,
          top: '50%',
          marginTop: -14,
          borderColor: accentColor,
        }}
        className="absolute w-7 h-7 rounded-full bg-white border-2"
      />
    </View>
  );
};
