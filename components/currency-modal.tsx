'use client'

import { X, Languages } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrency, CURRENCIES, LANGUAGES } from '@/lib/contexts/currency-context'
import { useState, useEffect, useRef, type TouchEvent } from 'react'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: ModalTab
}

type ModalTab = 'language' | 'currency'

const suggestedCurrencies = ['EUR', 'GBP', 'USD', 'AUD', 'THB', 'SGD']
const suggestedLanguages = ['en-AU', 'en-GB', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'zh-CN', 'ja-JP', 'ko-KR', 'pt-BR']

export function CurrencyModal({ open, onOpenChange, initialTab = 'language' }: CurrencyModalProps) {
  const { selectedCurrency, setSelectedCurrency, selectedLanguage, setSelectedLanguage } = useCurrency()
  const [activeTab, setActiveTab] = useState<ModalTab>('language')
  const [isDesktop, setIsDesktop] = useState(false)

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

  const handleSelectCurrency = (currency: string) => {
    setSelectedCurrency(currency)
    onOpenChange(false)
  }

  const handleSelectLanguage = (language: string) => {
    setSelectedLanguage(language)
    onOpenChange(false)
  }

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const updateIsDesktop = (event?: MediaQueryListEvent) => {
      setIsDesktop(event ? event.matches : mediaQuery.matches)
    }

    updateIsDesktop()
    mediaQuery.addEventListener('change', updateIsDesktop)

    return () => mediaQuery.removeEventListener('change', updateIsDesktop)
  }, [])

  // Split into suggested and all currencies/languages
  const suggested = CURRENCIES.filter(c => suggestedCurrencies.includes(c.code))
  const allCurrencies = CURRENCIES.filter(c => !suggestedCurrencies.includes(c.code))
  const suggestedLanguageItems = LANGUAGES.filter(language => suggestedLanguages.includes(language.code))
  const allLanguageItems = LANGUAGES.filter(language => !suggestedLanguages.includes(language.code))

  const renderLanguageGrid = (items: typeof LANGUAGES, cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4') => (
    <div className={`grid ${cols} gap-x-4 gap-y-0`}>
      {items.map(language => {
        const isSelected = selectedLanguage === language.code
        return (
          <button
            key={language.code}
            onClick={() => handleSelectLanguage(language.code)}
            className="px-3 py-3 text-left rounded-xl transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <div className={`text-sm truncate ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
              {language.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{language.region}</div>
          </button>
        )
      })}
    </div>
  )

  const renderCurrencyGrid = (items: typeof CURRENCIES, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4') => (
    <div className={`grid ${columns} gap-x-4 gap-y-0`}>
      {items.map(currency => {
        const isSelected = selectedCurrency === currency.code
        return (
          <button
            key={currency.code}
            onClick={() => handleSelectCurrency(currency.code)}
            className="px-3 py-3 text-left rounded-xl transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            <div className={`text-sm truncate ${isSelected ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
              {currency.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{currency.code}</div>
          </button>
        )
      })}
    </div>
  )

  if (!open) return null

  return isDesktop ? (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-w-5xl w-[92vw] max-h-[88vh] overflow-hidden p-0 rounded-3xl [&>button]:hidden">
        {/* Hidden but required for a11y */}
        <DialogTitle className="sr-only">
          {activeTab === 'language' ? 'Language and region' : 'Currency'}
        </DialogTitle>

        {/* Header row: tabs left, X right */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="inline-flex rounded-full bg-gray-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('language')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'language' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Language
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('currency')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'currency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Currency
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-6 py-6 space-y-8">
          {activeTab === 'language' ? (
            <>
              <div className="rounded-2xl bg-gray-50 px-5 py-4 border border-gray-100 max-w-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Region</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Saved for your account on this device. The site interface is English for now; prices follow your currency choice.
                      </div>
                    </div>
                  </div>
                  <div className="w-11 h-6 rounded-full bg-gray-200 flex items-center justify-start px-0.5 flex-shrink-0" aria-hidden>
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested for you</h4>
                    {renderLanguageGrid(suggestedLanguageItems, 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">All languages</h4>
                    {renderLanguageGrid(allLanguageItems, 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5')}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Suggested for you</h4>
                {renderCurrencyGrid(suggested, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All currencies</h4>
                {renderCurrencyGrid(allCurrencies, 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <>
      {/* ─── MOBILE: Slide-up bottom sheet ────────────────────────────────── */}
      <div>
        <div
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={() => onOpenChange(false)}
        />

        <div
          className="fixed inset-x-0 bottom-0 z-[70] animate-slide-up bg-white rounded-t-3xl flex flex-col max-h-[88dvh] transition-transform duration-100 ease-out will-change-transform"
          style={{ transform: `translateY(${sheetTranslateY}px)` }}
        >
          <div
            className="flex-shrink-0 touch-none"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="px-4 pt-2 pb-3 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                  {activeTab === 'language' ? 'Language and region' : 'Currency'}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {activeTab === 'language'
                    ? 'Choose your preferred language and region.'
                    : 'Choose how prices are displayed on the site.'}
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

          <div className="px-4 pt-3">
            <div className="grid grid-cols-2 rounded-full bg-gray-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('language')}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'language' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Language
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('currency')}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'currency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Currency
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 px-4 py-4 pb-8 space-y-6">
            {activeTab === 'language' ? (
              <>
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Region</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Saved on this device. Interface copy is English; prices use the currency you pick.
                      </div>
                    </div>
                    <div className="w-11 h-6 rounded-full bg-gray-200 flex items-center justify-start px-0.5" aria-hidden>
                      <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Choose a language and region</h3>
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested for you</h4>
                      {renderLanguageGrid(suggestedLanguageItems)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">All languages</h4>
                      {renderLanguageGrid(allLanguageItems)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Suggested for you</h3>
                  {renderCurrencyGrid(suggested)}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">All currencies</h3>
                  {renderCurrencyGrid(allCurrencies)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
