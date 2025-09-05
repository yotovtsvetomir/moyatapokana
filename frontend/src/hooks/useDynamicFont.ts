import { useEffect, useState } from "react";

export function useDynamicFont(fontObj: { font_url: string; font_family: string } | null) {
  const [fontFamily, setFontFamily] = useState<string>("sans-serif");

  useEffect(() => {
    if (!fontObj) return;

    const styleId = "dynamic-font-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `@import url('${fontObj.font_url}');`;
      document.head.appendChild(style);
    }

    setFontFamily(fontObj.font_family);
  }, [fontObj]);

  return fontFamily;
}
