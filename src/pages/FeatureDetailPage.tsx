import React from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { FeaturePageTemplate } from '@/components/marketing/FeaturePageTemplate'
import { featuresContent } from '@/data/featuresContent'

export default function FeatureDetailPage() {
  const { featureSlug } = useParams<{ featureSlug: string }>()
  
  // Get content for this feature slug
  const content = featureSlug ? featuresContent[featureSlug] : null
  
  // If feature doesn't exist, redirect to features hub
  if (!content) {
    return <Navigate to="/features" replace />
  }
  
  return <FeaturePageTemplate content={content} />
}
