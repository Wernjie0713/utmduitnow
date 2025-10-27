'use client';;
import * as React from 'react';
import { Switch as SwitchPrimitives } from 'radix-ui';
import { motion } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';

const [SwitchProvider, useSwitch] =
  getStrictContext('SwitchContext');

function Switch(props) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isChecked, setIsChecked] = useControlledState({
    value: props.checked,
    defaultValue: props.defaultChecked,
    onChange: props.onCheckedChange,
  });

  return (
    <SwitchProvider value={{ isChecked, setIsChecked, isPressed, setIsPressed }}>
      <SwitchPrimitives.Root {...props} onCheckedChange={setIsChecked} asChild>
        <motion.button
          data-slot="switch"
          whileTap="tap"
          initial={false}
          onTapStart={() => setIsPressed(true)}
          onTapCancel={() => setIsPressed(false)}
          onTap={() => setIsPressed(false)}
          {...props} />
      </SwitchPrimitives.Root>
    </SwitchProvider>
  );
}

function SwitchThumb({
  pressedAnimation,
  transition = { type: 'spring', stiffness: 300, damping: 25 },
  ...props
}) {
  const { isPressed } = useSwitch();

  return (
    <SwitchPrimitives.Thumb asChild>
      <motion.div
        data-slot="switch-thumb"
        whileTap="tab"
        layout
        transition={transition}
        animate={isPressed ? pressedAnimation : undefined}
        {...props} />
    </SwitchPrimitives.Thumb>
  );
}

function SwitchIcon({
  position,
  transition = { type: 'spring', bounce: 0 },
  ...props
}) {
  const { isChecked } = useSwitch();

  const isAnimated = React.useMemo(() => {
    if (position === 'right') return !isChecked;
    if (position === 'left') return isChecked;
    if (position === 'thumb') return true;
    return false;
  }, [position, isChecked]);

  return (
    <motion.div
      data-slot={`switch-${position}-icon`}
      animate={isAnimated ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={transition}
      {...props} />
  );
}

export { Switch, SwitchThumb, SwitchIcon, useSwitch };
