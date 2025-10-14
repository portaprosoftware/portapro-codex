import React from 'react'
import { FeaturePageTemplate } from '@/components/marketing/FeaturePageTemplate'
import { featuresContent } from '@/data/featuresContent'

export default function MobilePWAPage() {
  return <FeaturePageTemplate content={featuresContent['mobile-pwa']} />
}
