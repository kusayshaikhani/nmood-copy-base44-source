import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import AsyncButton from '@/components/shared/AsyncButton';

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footerLabel,
  onFooterAction,
  footerSuccessLabel,
  footerBusyLabel,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-dialog flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted mb-4 flex-shrink-0" />
        {(title || description) && (
          <SheetHeader className="mb-2 flex-shrink-0">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar momentum-scroll pb-[calc(110px+env(safe-area-inset-bottom,0px))]">{children}</div>
        {footerLabel && onFooterAction && (
          <SheetFooter className="mt-4 flex-shrink-0">
            <AsyncButton className="w-full" onClick={onFooterAction} successLabel={footerSuccessLabel} busyLabel={footerBusyLabel}>{footerLabel}</AsyncButton>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}