import { logger } from "@/services/utils/logger"

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.spyOn(console, "warn").mockImplementation(() => {})
    jest.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  describe("error", () => {
    it("nao loga em producao", () => {
      process.env.NODE_ENV = "production"
      const error = new Error("test error")
      error.code = "TEST_CODE"

      logger.error("test context", error, { extra: "meta" })

      expect(console.error).not.toHaveBeenCalled()
    })

    it("loga em desenvolvimento", () => {
      process.env.NODE_ENV = "development"
      const error = new Error("test error")
      error.code = "TEST_CODE"

      logger.error("test context", error, { extra: "meta" })

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"ctx":"test context"'))
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"code":"TEST_CODE"'))
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"message":"test error"'))
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"extra":"meta"'))
    })

    it("loga erro sem codigo", () => {
      process.env.NODE_ENV = "development"
      const error = new Error("sem codigo")

      logger.error("ctx", error)

      expect(console.error).toHaveBeenCalledWith(expect.not.stringContaining('"code"'))
    })
  })

  describe("warn", () => {
    it("nao loga em producao", () => {
      process.env.NODE_ENV = "production"
      logger.warn("test", "warning message")
      expect(console.warn).not.toHaveBeenCalled()
    })

    it("loga em desenvolvimento", () => {
      process.env.NODE_ENV = "development"
      logger.warn("test ctx", "warning message", { extra: "meta" })

      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"ctx":"test ctx"'))
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('"message":"warning message"')
      )
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"extra":"meta"'))
    })
  })

  describe("info", () => {
    it("nao loga em producao", () => {
      process.env.NODE_ENV = "production"
      logger.info("test", "info message")
      expect(console.info).not.toHaveBeenCalled()
    })

    it("loga em desenvolvimento", () => {
      process.env.NODE_ENV = "development"
      logger.info("test ctx", "info message", { extra: "meta" })

      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"ctx":"test ctx"'))
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"message":"info message"'))
      expect(console.info).toHaveBeenCalledWith(expect.stringContaining('"extra":"meta"'))
    })
  })
})
