'use client';;
import * as React from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { AnimatePresence, motion } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';

const [RadioGroupProvider, useRadioGroup] =
  getStrictContext('RadioGroupContext');

const [RadioGroupItemProvider, useRadioGroupItem] =
  getStrictContext('RadioGroupItemContext');

function RadioGroup(props) {
  const [value, setValue] = useControlledState({
    value: props.value ?? undefined,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange,
  });

  return (
    <RadioGroupProvider value={{ value, setValue }}>
      <RadioGroupPrimitive.Root data-slot="radio-group" {...props} onValueChange={setValue} />
    </RadioGroupProvider>
  );
}

function RadioGroupIndicator({
  transition = { type: 'spring', stiffness: 200, damping: 16 },
  ...props
}) {
  const { isChecked } = useRadioGroupItem();

  return (
    <AnimatePresence>
      {isChecked && (
        <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" asChild forceMount>
          <motion.div
            key="radio-group-indicator-circle"
            data-slot="radio-group-indicator-circle"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={transition}
            {...props} />
        </RadioGroupPrimitive.Indicator>
      )}
    </AnimatePresence>
  );
}

function RadioGroupItem({
  value: valueProps,
  disabled,
  required,
  ...props
}) {
  const { value } = useRadioGroup();
  const [isChecked, setIsChecked] = React.useState(value === valueProps);

  React.useEffect(() => {
    setIsChecked(value === valueProps);
  }, [value, valueProps]);

  return (
    <RadioGroupItemProvider value={{ isChecked, setIsChecked }}>
      <RadioGroupPrimitive.Item asChild value={valueProps} disabled={disabled} required={required}>
        <motion.button
          data-slot="radio-group-item"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          {...props} />
      </RadioGroupPrimitive.Item>
    </RadioGroupItemProvider>
  );
}

export { RadioGroup, RadioGroupItem, RadioGroupIndicator, useRadioGroup, useRadioGroupItem };
