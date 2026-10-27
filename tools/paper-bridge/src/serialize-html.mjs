// Executada somente no navegador local da referência, nunca para alterar o Paper.
export function serializeScreen(root) {
  const properties = [
    "display", "position", "box-sizing", "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis",
    "align-items", "align-self", "justify-content", "gap", "row-gap", "column-gap", "grid-template-columns", "grid-template-rows",
    "width", "height", "min-width", "max-width", "min-height", "max-height", "padding", "margin",
    "border", "border-radius", "background-color", "color", "font-family", "font-size", "font-weight", "font-style",
    "line-height", "letter-spacing", "text-align", "text-decoration", "white-space", "overflow-wrap",
    "opacity", "box-shadow", "overflow", "object-fit", "vertical-align", "text-transform", "z-index",
  ];
  let serial = 0, omitted = 0, fixed = 0;
  const bounds = root.getBoundingClientRect();
  const texts = [], images = [];
  function copy(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (!(node instanceof Element) || ["SCRIPT", "STYLE", "LINK"].includes(node.tagName)) return null;
    const computed = getComputedStyle(node), rect = node.getBoundingClientRect();
    if (computed.display === "none" || computed.visibility === "hidden" || (rect.width <= 1 && rect.height <= 1 && computed.overflow === "hidden")) { omitted++; return null; }
    const tag = ["INPUT", "TEXTAREA", "BUTTON", "FORM"].includes(node.tagName) ? "div" : node.tagName.toLowerCase();
    const clone = node.namespaceURI === "http://www.w3.org/2000/svg" ? node.cloneNode(true) : document.createElement(tag);
    const name = "bp-" + (++serial) + "-" + tag;
    if (node.namespaceURI !== "http://www.w3.org/2000/svg") {
      for (const property of properties) clone.style.setProperty(property, computed.getPropertyValue(property));
      clone.style.setProperty("font-family", "Arial, sans-serif");
      clone.setAttribute("layer-name", name);
      if (computed.position === "fixed") {
        fixed++;
        Object.assign(clone.style, { position: "absolute", left: rect.left - bounds.left + "px", top: rect.top - bounds.top + "px", width: rect.width + "px", height: rect.height + "px" });
      } else if (computed.position === "sticky") clone.style.position = "relative";
      if (node.tagName === "IMG") {
        clone.setAttribute("src", node.src);
        images.push({ name, source: node.src, width: rect.width, height: rect.height });
      } else if (["INPUT", "TEXTAREA"].includes(node.tagName)) {
        clone.textContent = node.value || node.getAttribute("placeholder") || "";
      } else for (const child of node.childNodes) { const result = copy(child); if (result) clone.append(result); }
      if ((node.childElementCount === 0 || ["H1", "H2", "H3", "P", "LABEL", "BUTTON"].includes(node.tagName)) && node.textContent.trim()) texts.push(node.textContent.trim());
    } else {
      clone.removeAttribute("class");
      clone.setAttribute("style", "width:" + rect.width + "px;height:" + rect.height + "px;color:" + computed.color + ";flex-shrink:0");
      clone.setAttribute("layer-name", name);
      for (const child of [clone, ...clone.querySelectorAll("*")]) for (const attribute of [...child.attributes]) if (attribute.name.toLowerCase().startsWith("on")) child.removeAttribute(attribute.name);
    }
    return clone;
  }
  const clone = copy(root);
  clone.style.width = bounds.width + "px";
  clone.style.height = bounds.height + "px";
  clone.style.position = "relative";
  clone.style.margin = "0";
  return {
    html: clone.outerHTML, width: bounds.width, height: bounds.height,
    expectedTexts: [...new Set(texts)], images,
    conversions: { inlineStyles: serial, omittedInvisible: omitted, fixedToAbsolute: fixed, fontFallback: "Arial", controlsToFrames: true },
  };
}
