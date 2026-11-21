module.exports = {
  title: "tscircuit devices",
  tagline: "USB device usage, mounting drawings and protocols",
  url: "https://devices.tscircuit.com",
  baseUrl: "/docs/",
  trailingSlash: true,
  favicon: "img/ts.svg",
  onBrokenLinks: "throw",
  presets: [["classic", {
    docs: { path: "pages", routeBasePath: "/", sidebarPath: require.resolve("./sidebars.js") },
    blog: false,
    theme: { customCss: require.resolve("./src/css/custom.css") },
  }]],
  themeConfig: {
    navbar: {title: "tscircuit", logo: {alt: "", src: "img/ts.svg", href: "https://tscircuit.com"},
      items: [
        {label: "Devices", href: "https://devices.tscircuit.com/", target: "_self", position: "left"},
        {label: "Device docs", to: "/docs/", position: "left"},
        {label: "tscircuit docs", href: "https://docs.tscircuit.com", position: "right"},
        {label: "GitHub", href: "https://github.com/tscircuit/devices.tscircuit.com", position: "right"},
      ]},
    footer: {style: "light", copyright: "tscircuit, Inc."},
  },
}
