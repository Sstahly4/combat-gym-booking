'use client'

import { createPortal } from 'react-dom'
import { X, Languages } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCurrency, CURRENCIES, LANGUAGES } from '@/lib/contexts/currency-context'
import { useState, useEffect, useRef, type TouchEvent } from 'react'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: ModalTab
  /** Pick a currency then confirm with Cancel / Done instead of closing on each tap */
  confirmSelection?: boolean
  /** Hide language tab — currency picker only */
  currencyOnly?: boolean
  /** Stack above nested overlays (e.g. checkout review modal) */
  stackClassName?: string
  /** Review checkout: portal sheet, shade content only, keep bottom Continue bar visible */
  checkoutSheet?: boolean
}

/** Height of the review modal fixed footer (progress + Continue). */
const CHECKOUT_FOOTER_OFFSET =
  'max(6.25rem, calc(5.25rem + env(safe-area-inset-bottom)))'

type ModalTab = 'language' | 'currency'

const suggestedCurrencies = ['EUR', 'GBP', 'USD', 'AUD', 'THB', 'SGD']
const suggestedLanguages = ['en-AU', 'en-GB', 'en-US', 'de-DE', 'fr-FR', 'es-ES', 'zh-CN', 'ja-JP', 'ko-KR', 'pt-BR']

export function CurrencyModal({
  open,
  onOpenChange,
  initialTab = 'language',
  confirmSelection = false,
  currencyOnly = false,
  stackClassName,
  checkoutSheet = false,
}: CurrencyModalProps) {
  const { selectedCurrency, setSelectedCurrency, selectedLanguage, setSelectedLanguage } = useCurrency()
  const [activeTab, setActiveTab] = useState<ModalTab>('language')
  const [draftCurrency, setDraftCurrency] = useState(selectedCurrency)
  const [draftLanguage, setDraftLanguage] = useState(selectedLanguage)
  const [isDesktop, setIsDesktop] = useState(false)

  const mobileBackdropZ = checkoutSheet ? 'z-[330]' : (stackClassName ?? 'z-[120]')
  const mobileSheetZ = checkoutSheet ? 'z-[331]' : (stackClassName ? 'z-[331]' : 'z-[130]')
  const desktopStack = checkoutSheet ? 'z-[330]' : (stackClassName ?? 'z-[100]')

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
    if (confirmSelection) {
      setDraftCurrency(currency)
      return
    }
    setSelectedCurrency(currency)
    onOpenChange(false)
  }

  const handleSelectLanguage = (language: string) => {
    if (confirmSelection) {
      setDraftLanguage(language)
      return
    }
    setSelectedLanguage(language)
    onOpenChange(false)
  }

  const handleConfirm = () => {
    if (confirmSelection) {
      setSelectedCurrency(draftCurrency)
      if (!currencyOnly) setSelectedLanguage(draftLanguage)
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  useEffect(() => {
    if (open) {
      setActiveTab(currencyOnly ? 'currency' : initialTab)
      setDraftCurrency(selectedCurrency)
      setDraftLanguage(selectedLanguage)
    }
  }, [open, initialTab, currencyOnly, selectedCurrency, selectedLanguage])

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

  const displayCurrency = confirmSelection ? draftCurrency : selectedCurrency
  const displayLanguage = confirmSelection ? draftLanguage : selectedLanguage

  const confirmFooter = confirmSelection ? (
    <div
      className="flex flex-row items-center gap-3 px-4 py-3 border-t border-gray-100 flex-shrink-0 bg-white"
      style={checkoutSheet ? undefined : { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <Button
        type="button"
        variant="outline"
        className="flex-1 h-11 font-semibold rounded-xl"
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="flex-1 h-11 font-semibold rounded-xl bg-[#003580] hover:bg-[#003580]/90"
        onClick={handleConfirm}
      >
        Done
      </Button>
    </div>
  ) : null

  const renderLanguageGrid = (items: typeof LANGUAGES, cols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4') => (
    <div className={`grid ${cols} gap-x-4 gap-y-0`}>
      {items.map(language => {
        const isSelected = displayLanguage === language.code
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
        const isSelected = displayCurrency === currency.code
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
    <Dialog open={open} onOpenChange={onOpenChange} stackClassName={desktopStack}>
      <DialogContent className="flex flex-col max-w-5xl w-[92vw] max-h-[88vh] overflow-hidden p-0 rounded-3xl [&>button]:hidden">
        {/* Hidden but required for a11y */}
        <DialogTitle className="sr-only">
          {activeTab === 'language' ? 'Language and region' : 'Currency'}
        </DialogTitle>

        {/* Header row: tabs left, X right */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          {currencyOnly ? (
            <h2 className="text-lg font-semibold text-gray-900">Currency</h2>
          ) : (
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
          )}

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
          {!currencyOnly && activeTab === 'language' ? (
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
        {confirmFooter}
      </DialogContent>
    </Dialog>
  ) : (
    (() => {
      const mobileSheet = (
        <>
          <button
            type="button"
            aria-label="Close"
            className={`fixed inset-x-0 top-0 bg-black/50 ${mobileBackdropZ}`}
            style={checkoutSheet ? { bottom: CHECKOUT_FOOTER_OFFSET } : { bottom: 0 }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenChange(false)
            }}
          />

          <div
            className={`fixed inset-x-0 ${mobileSheetZ} animate-slide-up bg-white rounded-t-3xl flex flex-col transition-transform duration-100 ease-out will-change-transform shadow-[0_-8px_30px_rgba(0,0,0,0.12)]`}
            style={{
              bottom: checkoutSheet ? CHECKOUT_FOOTER_OFFSET : 0,
              maxHeight: checkoutSheet
                ? 'min(75dvh, calc(100dvh - 6.25rem - env(safe-area-inset-bottom)))'
                : '88dvh',
              transform: `translateY(${sheetTranslateY}px)`,
            }}
          >
          {/* Swipe handle only — keep close button outside touch-none so taps register reliably */}
          <div
            className="flex-shrink-0 touch-none"
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 bg-white px-4 pt-1 pb-3 border-b border-gray-100 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                {currencyOnly || activeTab === 'currency' ? 'Currency' : 'Language and region'}
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {currencyOnly || activeTab === 'currency'
                  ? 'Choose how prices are displayed on the site.'
                  : 'Choose your preferred language and region.'}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenChange(false)
              }}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {!currencyOnly && (
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
          )}

          <div className={`overflow-y-auto flex-1 px-4 py-4 space-y-6 ${confirmSelection ? 'pb-4' : 'pb-8'}`}>
            {!currencyOnly && activeTab === 'language' ? (
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
          {confirmFooter}
          </div>
        </>
      )

      if (checkoutSheet && typeof document !== 'undefined') {
        return createPortal(mobileSheet, document.body)
      }

      return <div>{mobileSheet}</div>
    })()
  )
}
