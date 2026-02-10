'use client'

export function ShowOnMapLink() {
  const handleClick = () => {
    // Scroll to map section
    const mapElement = document.getElementById('gym-map-section')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
