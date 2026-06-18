'use client'

function findVisibleGymMapAnchor(): HTMLElement | null {
  const anchors = document.querySelectorAll<HTMLElement>('[data-gym-map-anchor]')
  for (const el of anchors) {
    if (el.offsetParent !== null) return el
  }
  return anchors[0] ?? null
}

export function ShowOnMapLink() {
  const handleClick = () => {
    const mapElement = findVisibleGymMapAnchor()
    mapElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <span
      className="md:hidden text-[#003580] text-sm underline cursor-pointer"
      onClick={handleClick}
    >
      — Show on map
    </span>
  )
}
