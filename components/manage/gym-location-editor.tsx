'use client'

import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GymCountryField } from '@/components/manage/gym-country-field'
import { GymLocationAddressSearch } from '@/components/manage/gym-location-address-search'
import { GymLocationMapPreview } from '@/components/manage/gym-location-map-preview'
import { cn } from '@/lib/utils'

export function GymLocationEditor({
  saving,
  showVerificationHints,
  address,
  city,
  country,
  latitude,
  longitude,
  googleMapsLink,
  cityNonLatinWarning,
  onAddressChange,
  onCityChange,
  onCityBlur,
  onCountryChange,
  onLatitudeChange,
  onLongitudeChange,
  onGoogleMapsLinkChange,
  onApplySearch,
}: {
  saving: boolean
  showVerificationHints: boolean
  address: string
  city: string
  country: string
  latitude: string
  longitude: string
  googleMapsLink: string
  cityNonLatinWarning: boolean
  onAddressChange: (value: string) => void
  onCityChange: (value: string) => void
  onCityBlur: (value: string) => void
  onCountryChange: (value: string) => void
  onLatitudeChange: (value: string) => void
  onLongitudeChange: (value: string) => void
  onGoogleMapsLinkChange: (value: string) => void
  onApplySearch: (payload: {
    address: string
    city: string
    latitude: string
    longitude: string
    country: string | null
  }) => void
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-14">
      <div
        className={cn(
          'flex min-h-0 flex-col gap-8',
          'lg:max-h-[min(72vh,calc(100dvh-11rem))] lg:overflow-y-auto lg:overscroll-contain lg:pr-1',
        )}
      >
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Find your address</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search to fill your street address, city, and map pin — then fine-tune any field below.
            </p>
          </div>
          <GymLocationAddressSearch disabled={saving} onApply={onApplySearch} />
        </section>

        <div className="lg:hidden">
          <GymLocationMapPreview
            address={address}
            city={city}
            country={country}
            latitude={latitude}
            longitude={longitude}
            googleMapsLink={googleMapsLink}
          />
        </div>

        <section className="space-y-5 border-t border-gray-100 pt-8">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Address</h2>
            <p className="mt-1 text-sm text-gray-500">
              Shown on your listing and used for search by area.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              name="address"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="e.g., 123 Soi Bang Tao, Bangtao Beach, Phuket 83110, Thailand"
              required
            />
            <p className="text-xs text-gray-500">
              Include street number, street name, and postcode when you have them.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City or area</Label>
              <Input
                id="city"
                name="city"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                onBlur={(e) => onCityBlur(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Use the name guests search for — e.g. &quot;Krabi&quot; instead of a local village.
              </p>
              {cityNonLatinWarning ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                  Use the English or Latin spelling so international guests can find you — e.g.
                  &quot;Koh Phangan&quot;, &quot;Tokyo&quot;, &quot;Bangkok&quot;.
                </p>
              ) : null}
            </div>

            <GymCountryField
              id="country"
              label="Country"
              value={country}
              onChange={onCountryChange}
              required
            />
            <input type="hidden" name="country" value={country} required />
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-8">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Google Maps listing</h2>
            <p className="mt-1 text-sm text-gray-500">
              {showVerificationHints
                ? 'Link to your gym’s public Google Maps page. Should match the address above.'
                : 'Optional — should match the address above.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_maps_link">Google Maps URL</Label>
            <Input
              id="google_maps_link"
              name="google_maps_link"
              type="url"
              value={googleMapsLink}
              onChange={(e) => onGoogleMapsLinkChange(e.target.value)}
              placeholder="https://maps.google.com/..."
              required={showVerificationHints}
            />
          </div>
        </section>

        <details className="group border-t border-gray-100 pt-6">
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-gray-700',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            <span>Advanced: map coordinates</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="mt-2 text-xs text-gray-500">
            Usually filled automatically from search. Only edit if you need to nudge the pin.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => onLatitudeChange(e.target.value)}
                placeholder="e.g., 7.8804"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => onLongitudeChange(e.target.value)}
                placeholder="e.g., 98.3923"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="hidden lg:sticky lg:top-24 lg:block lg:self-start lg:max-h-[min(72vh,calc(100dvh-11rem))]">
        <div className="flex min-h-[min(72vh,calc(100dvh-11rem))] items-center">
          <GymLocationMapPreview
            className="w-full"
            address={address}
            city={city}
            country={country}
            latitude={latitude}
            longitude={longitude}
            googleMapsLink={googleMapsLink}
          />
        </div>
      </div>
    </div>
  )
}
