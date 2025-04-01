export function appendClass(el: HTMLElement, classRecord: Record<string, boolean>) {
  for (const className in classRecord) {
    if (classRecord[className] && !el.classList.contains(className)) {
      el.classList.add(className)
    } else {
      el.classList.remove(className)
    }
  }
}
