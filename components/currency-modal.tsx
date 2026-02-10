'use client'

import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCurrency, CURRENCIES } from '@/lib/contexts/currency-context'

interface CurrencyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CurrencyModal({ open, onOpenChange }: CurrencyModalProps) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency()

  const handleSelect = (currency: string) => {
    setSelectedCurrency(currency)
    onOpenChange(false)
  }

  // Split into suggested and all currencies
  const suggestedCurrencies = ['EUR', 'GBP', 'USD', 'NZD', 'SGD', 'MYR']
  const suggested = CURRENCIES.filter(c => suggestedCurrencies.includes(c.code))
  const allCurrencies = CURRENCIES.filter(c => !suggestedCurrencies.includes(c.code))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
  )
}
