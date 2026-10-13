const isDev = process.env.NODE_ENV !== "production"

export const logger = {
  error: (ctx, error, meta = {}) => {
    if (!isDev) return
    const payload = {
      ctx,
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
      ...meta
    }
    console.error(JSON.stringify(payload))
  },

  warn: (ctx, message, meta = {}) => {
    if (!isDev) return
    console.warn(JSON.stringify({ ctx, message, ...meta }))
  },

  info: (ctx, message, meta = {}) => {
    if (!isDev) return
    console.info(JSON.stringify({ ctx, message, ...meta }))
  }
}
