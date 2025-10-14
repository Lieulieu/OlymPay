export const toDate = (x: any): Date =>
  x && typeof x.toDate === "function" ? x.toDate() : new Date(x || Date.now());
