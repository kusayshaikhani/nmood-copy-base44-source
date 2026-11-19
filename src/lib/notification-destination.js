import {READABLE_SYSTEM_EVENTS,systemMessagePath} from './system-communications';
// Only known local destinations; never navigate to a provider-supplied URL.
export function notificationDestination(notification) {
 if (!notification?._locked && notification?._targetAvailable!==false && READABLE_SYSTEM_EVENTS.has(notification?._type)) { const message=systemMessagePath(notification.id); if(message)return message; }
 if (notification?._type === 'photo_verification_approved') return '/profile';
 if (notification?._type === 'welcome') return '/explore';
 const path=notification?._path;
 if(path==='/Home')return '/';
 return typeof path==='string' && (['/','/explore','/messages','/pals'].includes(path)||/^\/(pal|circle|experience|messages)\/[^/?#]+$/.test(path)) ? path : '/notifications';
}
