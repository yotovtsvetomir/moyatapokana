import { useEffect } from "react";

export function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: () => void
) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const isInsideSome = refs.some(ref =>
        ref.current?.contains(event.target as Node)
      );

      if (!isInsideSome) {
        handler();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [refs, handler]);
}
