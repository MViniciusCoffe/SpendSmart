// Stryker roda só o project "unit": as suítes de integração dependem de banco/Supabase local
const { projects } = require("./jest.config")

module.exports = projects.find(project => project.displayName === "unit")
