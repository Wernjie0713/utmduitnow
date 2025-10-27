'use client';;
import * as React from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import { AnimatePresence, motion } from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';
import { useControlledState } from '@/hooks/use-controlled-state';

const [HoverCardProvider, useHoverCard] =
  getStrictContext('HoverCardContext');

function HoverCard(props) {
  const [isOpen, setIsOpen] = useControlledState({
    value: props?.open,
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
  });

  return (
    <HoverCardProvider value={{ isOpen, setIsOpen }}>
      <HoverCardPrimitive.Root data-slot="hover-card" {...props} onOpenChange={setIsOpen} />
    </HoverCardProvider>
  );
}

function HoverCardTrigger(props) {
  return (<HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />);
}

function HoverCardPortal(props) {
  const { isOpen } = useHoverCard();

  return (
    <AnimatePresence>
      {isOpen && (
        <HoverCardPrimitive.Portal forceMount data-slot="hover-card-portal" {...props} />
      )}
    </AnimatePresence>
  );
}

function HoverCardContent({
  align,
  alignOffset,
  side,
  sideOffset,
  avoidCollisions,
  collisionBoundary,
  collisionPadding,
  arrowPadding,
  sticky,
  hideWhenDetached,
  transition = { type: 'spring', stiffness: 300, damping: 25 },
  ...props
}) {
  return (
    <HoverCardPrimitive.Content
      asChild
      forceMount
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      avoidCollisions={avoidCollisions}
      collisionBoundary={collisionBoundary}
      collisionPadding={collisionPadding}
      arrowPadding={arrowPadding}
      sticky={sticky}
      hideWhenDetached={hideWhenDetached}>
      <motion.div
        key="hover-card-content"
        data-slot="hover-card-content"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={transition}
        {...props} />
    </HoverCardPrimitive.Content>
  );
}

function HoverCardArrow(props) {
  return <HoverCardPrimitive.Arrow data-slot="hover-card-arrow" {...props} />;
}

export { HoverCard, HoverCardTrigger, HoverCardPortal, HoverCardContent, HoverCardArrow, useHoverCard };
