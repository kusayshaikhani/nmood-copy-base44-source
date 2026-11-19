import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from '@/components/ui/alert-dialog';
export default function LogoutConfirmation({open,onCancel,onConfirm}) {
 return <AlertDialog open={open} onOpenChange={next=>{if(!next)onCancel();}}><AlertDialogContent><AlertDialogTitle>Log out of Nmood?</AlertDialogTitle><AlertDialogDescription>You can sign in again. Your saved profile will remain on your account.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Log out</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
