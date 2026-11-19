export function connectionCelebrationType({ isAndroid, incomingSpark, serverMatched }) {
  if (!isAndroid || serverMatched !== true) return null;
  return incomingSpark === true ? 'spark' : 'match';
}
