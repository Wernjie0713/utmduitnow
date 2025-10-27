import * as React from 'react';
import { XIcon } from 'lucide-react';

import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
  DialogTrigger as DialogTriggerPrimitive,
  DialogPortal as DialogPortalPrimitive,
  DialogOverlay as DialogOverlayPrimitive,
  DialogClose as DialogClosePrimitive,
} from '@/Components/animate-ui/primitives/radix/dialog';
import { cn } from '@/lib/utils';

function Dialog(props) {
  return <DialogPrimitive {...props} />;
}

function DialogTrigger(props) {
  return <DialogTriggerPrimitive {...props} />;
}

function DialogClose(props) {
  return <DialogClosePrimitive {...props} />;
}

function DialogOverlay({
  className,
  ...props
}) {
  return (<DialogOverlayPrimitive className={cn('fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} {...props} />);
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  from = 'top',
  ...props
}) {
  return (
    <DialogPortalPrimitive>
      <DialogOverlay />
      <DialogContentPrimitive
        from={from}
        className={cn(
          'fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg -translate-x-[50%] -translate-y-[50%] gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-2xl sm:max-w-[425px]',
          className
        )}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogClosePrimitive
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClosePrimitive>
        )}
      </DialogContentPrimitive>
    </DialogPortalPrimitive>
  );
}

function DialogHeader({
  className,
  ...props
}) {
  return (
    <DialogHeaderPrimitive
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}) {
  return (
    <DialogFooterPrimitive
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props} />
  );
}

function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogTitlePrimitive
      className={cn('text-lg leading-none font-semibold', className)}
      {...props} />
  );
}

function DialogDescription({
  className,
  ...props
}) {
  return (<DialogDescriptionPrimitive className={cn('text-muted-foreground text-sm', className)} {...props} />);
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
