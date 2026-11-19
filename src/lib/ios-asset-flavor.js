// Native main compilation explicitly excludes isolated/rehearsal-only entry points.
// Other builds retain their existing behavior.
export const MAIN_DEVICE_BUILD = typeof __NMOOD_MAIN_DEVICE__ !== 'undefined' && __NMOOD_MAIN_DEVICE__ === true;
