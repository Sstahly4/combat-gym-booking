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
      <div className="flex flex-col gap-6">
        <GymLocationAddressSearch disabled={saving} onApply={onApplySearch} />

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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              name="address"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="e.g. 123 Soi Bang Tao, Phuket 83110"
              required
            />
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
                placeholder="e.g. Phuket"
                required
              />
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="google_maps_link">
            Google Maps URL{showVerificationHints ? '' : ' (optional)'}
          </Label>
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

        <details className="group">
          <summary
            className={cn(
              'flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-gray-600',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            <span>Map coordinates</span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
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
                placeholder="e.g. 7.8804"
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
                placeholder="e.g. 98.3923"
              />
            </div>
          </div>
        </details>
      </div>

      <div className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        <GymLocationMapPreview
          address={address}
          city={city}
          country={country}
          latitude={latitude}
          longitude={longitude}
          googleMapsLink={googleMapsLink}
        />
      </div>
    </div>
  )
}
