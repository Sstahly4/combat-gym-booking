'use client'

import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrency, CURRENCIES } from '@/lib/contexts/currency-context'
import { useState, useRef, type TouchEvent } from 'react'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyModal({ open, onOpenChange }: CurrencyModalProps) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency()

  // Swipe logic for mobile bottom sheet
  const [sheetTranslateY, setSheetTranslateY] = useState(0)
  const sheetStartY = useRef(0)
  const sheetIsDragging = useRef(false)

  const handleSheetTouchStart = (e: TouchEvent) => {
    sheetStartY.current = e.touches[0].clientY
    sheetIsDragging.current = true
  }

  const handleSheetTouchMove = (e: TouchEvent) => {
    if (!sheetIsDragging.current) return
    const currentY = e.touches[0].clientY
    const diffY = currentY - sheetStartY.current
    // Only allow dragging down
    if (diffY > 0) {
      setSheetTranslateY(diffY)
    }
  }

  const handleSheetTouchEnd = () => {
    if (!sheetIsDragging.current) return
    sheetIsDragging.current = false
    if (sheetTranslateY > 100) { // Threshold to close
      onOpenChange(false)
    }
    setSheetTranslateY(0)
  }

  const handleSelect = (currency: string) => {
    setSelectedCurrency(currency)
    onOpenChange(false)
  }

  // Split into suggested and all currencies
  const suggestedCurrencies = ['EUR', 'GBP', 'USD', 'NZD', 'SGD', 'MYR']
  const suggested = CURRENCIES.filter(c => suggestedCurrencies.includes(c.code))
  const allCurrencies = CURRENCIES.filter(c => !suggestedCurrencies.includes(c.code))

  if (!open) return null

  return (
    <>
      {/* ─── MOBILE: Slide-up bottom sheet (md:hidden) ───────────────────── */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={() => onOpenChange(false)}
        />
        
        {/* Sheet */}
        <div 
          className="fixed inset-x-0 bottom-0 z-[70] animate-slide-up bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85dvh] transition-transform duration-100 ease-out will-change-transform"
          style={{ transform: `translateY(${sheetTranslateY}px)` }}
        >
          {/* Header Area (Draggable) */}
          <div
            className="flex-shrink-0 touch-none"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header Content */}
            <div className="px-4 pt-2 pb-3 border-b border-gray-100 flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Select your currency</h2>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  Where applicable prices will be converted to, and shown in, the currency that you select.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 -mr-1 rounded-full hover:bg-gray-100 active:bg-gray-200 flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-4 py-4 pb-8 space-y-6">
            {/* Suggested Currencies */}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3 uppercase tracking-wide">Suggested for you</h3>
              <div className="grid grid-cols-2 gap-2">
                {suggested.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors touch-manipulation ${
                      selectedCurrency === currency.code
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{currency.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{currency.code}</div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <div className="text-[#003580] font-bold">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Currencies */}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3 uppercase tracking-wide">All currencies</h3>
              <div className="grid grid-cols-2 gap-2"> {/* Mobile: 2 cols is better for touch targets */}
                {allCurrencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors touch-manipulation ${
                      selectedCurrency === currency.code
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm truncate">{currency.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{currency.code}</div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <div className="text-[#003580] font-bold">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP: Original Dialog ────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hidden md:block max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">Select your currency</DialogTitle>
            <p className="text-sm text-gray-600">
              Where applicable prices will be converted to, and shown in, the currency that you select. 
              The currency you pay in may differ based on your reservation, and a service fee may also apply.
            </p>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Suggested Currencies */}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Suggested for you</h3>
              <div className="grid grid-cols-2 gap-2">
                {suggested.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors ${
                      selectedCurrency === currency.code
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{currency.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{currency.code}</div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <div className="text-[#003580]">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Currencies */}
            <div>
              <h3 className="font-semibold text-sm text-gray-900 mb-3">All currencies</h3>
              <div className="grid grid-cols-3 gap-2">
                {allCurrencies.map(currency => (
                  <button
                    key={currency.code}
                    onClick={() => handleSelect(currency.code)}
                    className={`p-3 text-left rounded-lg border-2 transition-colors ${
                      selectedCurrency === currency.code
                        ? 'border-[#003580] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{currency.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{currency.code}</div>
                      </div>
                      {selectedCurrency === currency.code && (
                        <div className="text-[#003580]">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
