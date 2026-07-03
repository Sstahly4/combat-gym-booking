'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GymCountryField } from '@/components/manage/gym-country-field'
import { GymLocationAddressSearch } from '@/components/manage/gym-location-address-search'
import { GymLocationMapPreview } from '@/components/manage/gym-location-map-preview'
import { GymEditPanel, GymEditSection } from '@/components/manage/gym-edit-section'

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
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
      <GymEditPanel>
        <GymEditSection
          title="Find your address"
          description="Search OpenStreetMap to fill your street address, city, and map pin."
        >
          <GymLocationAddressSearch disabled={saving} onApply={onApplySearch} />
          <div className="lg:hidden">
            <GymLocationMapPreview
              embedded
              address={address}
              city={city}
              country={country}
              latitude={latitude}
              longitude={longitude}
              googleMapsLink={googleMapsLink}
            />
          </div>
        </GymEditSection>

        <GymEditSection
          title="Address"
          description="What guests see on your listing and how we match search by area."
        >
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
                title="Prefilled from map search; edit if you prefer a different area name for guests"
              />
              <p className="text-xs text-gray-500">
                Use the name guests search for — e.g. &quot;Krabi&quot; instead of a local village if that
                fits your listing better.
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
        </GymEditSection>

        <GymEditSection
          title="Google Maps listing"
          description={
            showVerificationHints
              ? 'Link to your gym’s public Google Maps page — helps with listing verification.'
              : 'Optional link to your gym’s public Google Maps page.'
          }
        >
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
        </GymEditSection>

        <GymEditSection
          title="Map coordinates"
          description="Usually filled automatically when you pick a search result. Only edit if you need to nudge the pin."
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
        </GymEditSection>
      </GymEditPanel>

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
