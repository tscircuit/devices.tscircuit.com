const sections = require("./sections.json")
module.exports = {
  devices: ["index", "datasheets", ...sections.map(section => ({
    type: "category", ...section, collapsed: false,
  }))],
}
