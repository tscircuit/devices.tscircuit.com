import React from "react"
import Link from "@docusaurus/Link"
import NavbarContent from "@theme-original/Navbar/Content"
import {useLocation} from "@docusaurus/router"
import styles from "./styles.module.css"
import sections from "@site/sections.json"

export default function DeviceNavbar() {
  const {pathname} = useLocation()
  const current = pathname.replace(/\/$/, "").split("/").pop()
  return <>
    <NavbarContent />
    <nav className={styles.sections} aria-label="Device documentation sections">
      <Link className={styles.section} to="/docs/" aria-current={current === "docs" ? "page" : undefined}>Overview</Link>
      {sections.map(({label, items}) => <Link key={label} className={styles.section}
        aria-current={items.includes(current ?? "") ? "location" : undefined}
        to={"/docs/" + items[0] + "/"}>{label}</Link>)}
    </nav>
  </>
}
