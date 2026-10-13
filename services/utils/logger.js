export const logger = {
  error: (ctx, error, meta = {}) => {
    if (process.env.NODE_ENV === "production") return
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
    if (process.env.NODE_ENV === "production") return
    console.warn(JSON.stringify({ ctx, message, ...meta }))
  },

  info: (ctx, message, meta = {}) => {
    if (process.env.NODE_ENV === "production") return
    console.info(JSON.stringify({ ctx, message, ...meta }))
  }
}
