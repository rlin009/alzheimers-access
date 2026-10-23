"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListIcon, XIcon } from "./icons";
export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    {href:'/trial-alerts',label:'Trial alerts',current:path==='/trial-alerts'},
    {
      href: "/start",
      label: "Clinical trials",
      current: path === "/start" || path === "/results",
    },
    { href: "/support", label: "Local support", current: path === "/support" },
    {
      href: "/how-it-works",
      label: "How this works",
      current: path === "/how-it-works",
    },
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          Alzheimer’s Access
        </Link>
        <button
          className="menu-button"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          Menu{" "}
          {open ? (
            <XIcon size={24} aria-hidden />
          ) : (
            <ListIcon size={24} aria-hidden />
          )}
        </button>
        <nav
          id="main-navigation"
          className={open ? "main-nav is-open" : "main-nav"}
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/start"
            className="button button-indigo nav-start"
            onClick={() => setOpen(false)}
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
