let version = 0;
const listeners = new Set();

export function bumpCartVersion() {
  version += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToCart(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCartVersion() {
  return version;
}
