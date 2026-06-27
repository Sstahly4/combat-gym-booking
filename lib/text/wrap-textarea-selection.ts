/** Wrap the current textarea selection with markers (e.g. **bold** or _italic_). */
export function wrapTextareaSelection(
  textarea: HTMLTextAreaElement,
  wrapper: string,
): { value: string; selectionStart: number; selectionEnd: number } {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.slice(start, end)

  if (
    selected.length >= wrapper.length * 2 &&
    selected.startsWith(wrapper) &&
    selected.endsWith(wrapper)
  ) {
    const unwrapped = selected.slice(wrapper.length, -wrapper.length)
    const next = value.slice(0, start) + unwrapped + value.slice(end)
    return { value: next, selectionStart: start, selectionEnd: start + unwrapped.length }
  }

  const wrapped = selected ? `${wrapper}${selected}${wrapper}` : `${wrapper}${wrapper}`
  const next = value.slice(0, start) + wrapped + value.slice(end)
  const cursor = selected ? start + wrapped.length : start + wrapper.length

  return {
    value: next,
    selectionStart: selected ? start : start + wrapper.length,
    selectionEnd: cursor,
  }
}
