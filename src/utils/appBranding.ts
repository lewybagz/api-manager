export function applyBranding(): void {
  try {
    const stored = localStorage.getItem("appType");
    const appType = stored || (location.pathname.indexOf("/pw") === 0 ? "pw" : "api");
    const titles: Record<string, string> = {
      api: "ZekerKey - Secure API Management",
      pw: "ZekerKey Passwords - Secure Password Management",
    };
    document.title = titles[appType] || titles.api;

    const iconHref = appType === "pw"
      ? "assets/logos/logo-512x512-accent-favicon.png"
      : "assets/logos/favicon-48x48.png";
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = iconHref;
  } catch {
    // no-op
  }
}


