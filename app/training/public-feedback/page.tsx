"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { TrainingLocaleProvider } from '@/components/training-locale-provider';
import { useTrainingTranslation } from '@/lib/training-i18n';
interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  trainer_name?: string;
}

function PublicFeedbackPageContent() {
  const { t } = useTrainingTranslation();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Participant Info (Optional)
    respondent_name: '',
    respondent_email: '',
    
    // Ratings (1-5 scale)
    overall_rating: '',
    content_quality_rating: '',
    trainer_effectiveness_rating: '',
    venue_rating: '',
    
    // Yes/No/Maybe Questions
    will_recommend_training: '',
    
    // Open Text
    most_valuable_aspect: '',
    suggestions_for_improvement: '',
    additional_comments: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions/public/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        toast.error(t.session + ' ' + t.noSessionsFound);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error(t.failedToFetch + ' ' + t.session.toLowerCase());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.overall_rating || !formData.content_quality_rating || 
        !formData.trainer_effectiveness_rating || !formData.venue_rating) {
      toast.error(t.pleaseRateAllCategories);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        session_id: parseInt(sessionId!),
        qr_id: qrId ? parseInt(qrId) : null,
        ...formData,
        // Convert ratings to numbers
        overall_rating: parseInt(formData.overall_rating),
        content_quality_rating: parseInt(formData.content_quality_rating),
        trainer_effectiveness_rating: parseInt(formData.trainer_effectiveness_rating),
        venue_rating: parseInt(formData.venue_rating),
        // Anonymous if no name provided
        is_anonymous: !formData.respondent_name.trim()
      };

      const response = await fetch('/api/training/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success(t.feedbackSubmittedSuccess);
      } else {
        const error = await response.json();
        toast.error(error.message || t.failedToSubmitFeedback);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(t.failedToSubmitFeedback);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case '5': return t.excellent;
      case '4': return t.good;
      case '3': return t.average;
      case '2': return t.poor;
      case '1': return t.veryPoor;
      default: return '';
    }
  };

  const getRecommendLabel = (value: string) => {
    switch (value) {
      case 'yes': return t.yes;
      case 'no': return t.no;
      case 'maybe': return t.maybe;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.session + ' ' + t.noSessionsFound}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="bg-green-100 rounded-full p-4 inline-flex mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.thankYouForFeedback}</h1>
            <p className="text-gray-600 mb-6">{t.feedbackAppreciated}</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              {t.returnToHome}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-purple-600 rounded-full p-3 inline-flex mb-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.trainingSessionFeedback}</h1>
          <p className="text-gray-600 mt-1">{t.shareFeedbackDescription}</p>
          <div className="flex justify-center mt-4">
            
          </div>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="font-semibold text-lg text-purple-900 mb-2">{session.session_title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-purple-700">
                  <Calendar className="h-4 w-4" />
                  {new Date(session.session_date).toLocaleDateString('en-US')}
                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <Clock className="h-4 w-4" />
                  {session.session_time}
                </div>
                <div className="flex items-center gap-2 text-purple-700">
                  <MapPin className="h-4 w-4" />
                  {session.location}
                </div>
              </div>
              <div className="mt-3">
                <span className="text-purple-900 font-medium">{session.program_name}</span>
                {session.trainer_name && (
                  <p className="text-sm text-purple-700 mt-1">
                    {t.trainer}: {session.trainer_name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {t.yourRatings}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ratings Section */}
            <div className="space-y-6">
              {/* Overall Experience */}
              <div>
                <Label className="text-base font-semibold">{t.overallExperience}</Label>
                <p className="text-sm text-gray-600 mb-3">{t.overallExperienceDesc}</p>
                <RadioGroup 
                  value={formData.overall_rating} 
                  onValueChange={(value) => handleInputChange('overall_rating', value)}
                  className="flex flex-wrap gap-4"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`overall-${rating}`} />
                      <Label htmlFor={`overall-${rating}`} className="flex items-center gap-1">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">({getRatingLabel(rating.toString())})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Content Relevance */}
              <div>
                <Label className="text-base font-semibold">{t.contentRelevance}</Label>
                <p className="text-sm text-gray-600 mb-3">{t.contentRelevanceDesc}</p>
                <RadioGroup 
                  value={formData.content_quality_rating} 
                  onValueChange={(value) => handleInputChange('content_quality_rating', value)}
                  className="flex flex-wrap gap-4"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`content-${rating}`} />
                      <Label htmlFor={`content-${rating}`} className="flex items-center gap-1">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">({getRatingLabel(rating.toString())})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Trainer Knowledge */}
              <div>
                <Label className="text-base font-semibold">{t.trainerKnowledge}</Label>
                <p className="text-sm text-gray-600 mb-3">{t.trainerKnowledgeDesc}</p>
                <RadioGroup 
                  value={formData.trainer_effectiveness_rating} 
                  onValueChange={(value) => handleInputChange('trainer_effectiveness_rating', value)}
                  className="flex flex-wrap gap-4"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`trainer-${rating}`} />
                      <Label htmlFor={`trainer-${rating}`} className="flex items-center gap-1">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">({getRatingLabel(rating.toString())})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Venue & Facilities */}
              <div>
                <Label className="text-base font-semibold">{t.venueAndFacilities}</Label>
                <p className="text-sm text-gray-600 mb-3">{t.venueAndFacilitiesDesc}</p>
                <RadioGroup 
                  value={formData.venue_rating} 
                  onValueChange={(value) => handleInputChange('venue_rating', value)}
                  className="flex flex-wrap gap-4"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`venue-${rating}`} />
                      <Label htmlFor={`venue-${rating}`} className="flex items-center gap-1">
                        <span>{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">({getRatingLabel(rating.toString())})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <Label className="text-base font-semibold">{t.wouldYouRecommend}</Label>
              <RadioGroup 
                value={formData.will_recommend_training} 
                onValueChange={(value) => handleInputChange('will_recommend_training', value)}
                className="flex gap-6 mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="recommend-yes" />
                  <Label htmlFor="recommend-yes" className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    {t.yes}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="maybe" id="recommend-maybe" />
                  <Label htmlFor="recommend-maybe" className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-yellow-600" />
                    {t.maybe}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="recommend-no" />
                  <Label htmlFor="recommend-no" className="flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    {t.no}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Open Text Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t.additionalFeedback}</h3>
              
              <div>
                <Label htmlFor="liked">{t.whatDidYouLike}</Label>
                <Textarea
                  id="liked"
                  value={formData.most_valuable_aspect}
                  onChange={(e) => handleInputChange('most_valuable_aspect', e.target.value)}
                  placeholder={t.whatDidYouLike + '...'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="improve">{t.whatCouldImprove}</Label>
                <Textarea
                  id="improve"
                  value={formData.suggestions_for_improvement}
                  onChange={(e) => handleInputChange('suggestions_for_improvement', e.target.value)}
                  placeholder={t.whatCouldImprove + '...'}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="comments">{t.additionalFeedback}</Label>
                <Textarea
                  id="comments"
                  value={formData.additional_comments}
                  onChange={(e) => handleInputChange('additional_comments', e.target.value)}
                  placeholder={t.additionalFeedback + '...'}
                  rows={3}
                />
              </div>
            </div>

            {/* Optional Contact Info */}
            <div className="border-t pt-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">{t.provideFeedbackAnonymously}</p>
                <p className="text-sm text-gray-600">{t.orProvideContactInfo}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t.nameOptional}</Label>
                  <Input
                    id="name"
                    value={formData.respondent_name}
                    onChange={(e) => handleInputChange('respondent_name', e.target.value)}
                    placeholder={t.nameOptional}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t.emailOptional}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.respondent_email}
                    onChange={(e) => handleInputChange('respondent_email', e.target.value)}
                    placeholder={t.emailOptional}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="w-full md:w-auto min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t.submittingFeedback}
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t.submitFeedback}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PublicFeedbackLoading() {
  const { t } = useTrainingTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function PublicFeedbackPage() {
  return (
    <TrainingLocaleProvider>
      <Suspense fallback={<PublicFeedbackLoading />}>
        <PublicFeedbackPageContent />
      </Suspense>
    </TrainingLocaleProvider>
  );
}