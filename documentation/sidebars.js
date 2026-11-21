const sections = require("./sections.json")
module.exports = {
  devices: ["index", ...sections.map(section => ({
    type: "category", ...section, collapsed: false,
  }))],
}
