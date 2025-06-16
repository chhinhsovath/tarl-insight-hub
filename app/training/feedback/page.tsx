"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Star,
  QrCode,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainingSession {
  id: number;
  session_title: string;
  session_date: string;
  session_time: string;
  location: string;
  program_name: string;
  trainer_name: string;
}

interface FeedbackForm {
  overall_rating: number;
  content_quality_rating: number;
  trainer_effectiveness_rating: number;
  venue_rating: number;
  materials_rating: number;
  objectives_met: boolean | null;
  will_apply_learning: boolean | null;
  will_recommend_training: boolean | null;
  would_attend_future_training: boolean | null;
  training_duration_appropriate: boolean | null;
  materials_helpful: boolean | null;
  pace_appropriate: boolean | null;
  most_valuable_aspect: string;
  least_valuable_aspect: string;
  additional_topics_needed: string;
  suggestions_for_improvement: string;
  challenges_implementing: string;
  additional_comments: string;
  respondent_name: string;
  respondent_email: string;
}

export default function TrainingFeedbackPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FeedbackForm>({
    overall_rating: 0,
    content_quality_rating: 0,
    trainer_effectiveness_rating: 0,
    venue_rating: 0,
    materials_rating: 0,
    objectives_met: null,
    will_apply_learning: null,
    will_recommend_training: null,
    would_attend_future_training: null,
    training_duration_appropriate: null,
    materials_helpful: null,
    pace_appropriate: null,
    most_valuable_aspect: '',
    least_valuable_aspect: '',
    additional_topics_needed: '',
    suggestions_for_improvement: '',
    challenges_implementing: '',
    additional_comments: '',
    respondent_name: '',
    respondent_email: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
    
    // Log QR code usage if accessed via QR
    if (qrId && sessionId) {
      logQrUsage();
    }
  }, [sessionId, qrId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/training/sessions?id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSession(data[0]);
        } else {
          toast.error('Training session not found');
        }
      } else {
        toast.error('Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Error loading session details');
    } finally {
      setLoading(false);
    }
  };

  const logQrUsage = async () => {
    try {
      await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action_type: 'feedback',
          user_agent: navigator.userAgent,
          scan_data: { page: 'feedback', timestamp: new Date().toISOString() }
        }),
      });
    } catch (error) {
      console.error('Error logging QR usage:', error);
    }
  };

  const handleRatingChange = (field: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;

    // Basic validation
    if (formData.overall_rating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    setSubmitting(true);

    try {
      // Submit to existing feedback table
      const feedbackData = {
        training_title: session.session_title,
        training_date: session.session_date,
        training_location: session.location,
        respondent_name: formData.respondent_name || 'Anonymous',
        ...formData,
        submitted_via: qrId ? 'qr_code' : 'manual',
        qr_code_used: !!qrId
      };

      // Also create record in new training feedback system
      const newSystemData = {
        session_id: session.id,
        feedback_data: JSON.stringify(formData),
        overall_rating: formData.overall_rating,
        trainer_rating: formData.trainer_effectiveness_rating,
        content_rating: formData.content_quality_rating,
        venue_rating: formData.venue_rating,
        would_recommend: formData.will_recommend_training,
        comments: formData.additional_comments,
        suggestions: formData.suggestions_for_improvement,
        submitted_via: qrId ? 'qr_code' : 'manual',
        is_anonymous: !formData.respondent_name.trim()
      };

      // Submit to both systems
      const [oldSystemResponse, newSystemResponse] = await Promise.all([
        fetch('/api/data/training-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
        }),
        fetch('/api/training/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSystemData)
        })
      ]);

      if (oldSystemResponse.ok || newSystemResponse.ok) {
        setSubmitted(true);
        toast.success('Feedback submitted successfully!');
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`p-1 rounded transition-colors ${
                star <= value ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {value > 0 ? `${value}/5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  const BooleanQuestion = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: boolean | null; 
    onChange: (value: boolean) => void; 
    label: string;
  }) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
              value === true 
                ? 'bg-green-100 border-green-500 text-green-700' 
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
              value === false 
                ? 'bg-red-100 border-red-500 text-red-700' 
                : 'border-gray-300 hover:border-red-400'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </button>
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground">
              The training session you're looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully. 
              Your input helps us improve our training programs.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900">{session.session_title}</h3>
              <p className="text-sm text-blue-700 mt-1">
                Thank you for participating in this training session!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {qrId && <QrCode className="h-6 w-6 text-blue-600" />}
            <h1 className="text-3xl font-bold">Training Feedback</h1>
          </div>
          <p className="text-muted-foreground">
            Help us improve by sharing your experience
          </p>
        </div>

        {/* Session Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {session.session_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Program</Label>
                <p className="text-sm text-muted-foreground">{session.program_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(session.session_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(session.session_time)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your Feedback</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your honest feedback helps us improve our training programs.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Ratings Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Overall Experience</h3>
                
                <StarRating
                  value={formData.overall_rating}
                  onChange={(rating) => handleRatingChange('overall_rating', rating)}
                  label="Overall Rating *"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StarRating
                    value={formData.content_quality_rating}
                    onChange={(rating) => handleRatingChange('content_quality_rating', rating)}
                    label="Content Quality"
                  />

                  <StarRating
                    value={formData.trainer_effectiveness_rating}
                    onChange={(rating) => handleRatingChange('trainer_effectiveness_rating', rating)}
                    label="Trainer Effectiveness"
                  />

                  <StarRating
                    value={formData.venue_rating}
                    onChange={(rating) => handleRatingChange('venue_rating', rating)}
                    label="Venue & Facilities"
                  />

                  <StarRating
                    value={formData.materials_rating}
                    onChange={(rating) => handleRatingChange('materials_rating', rating)}
                    label="Training Materials"
                  />
                </div>
              </div>

              {/* Yes/No Questions */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Training Effectiveness</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <BooleanQuestion
                    value={formData.objectives_met}
                    onChange={(value) => handleBooleanChange('objectives_met', value)}
                    label="Were the training objectives met?"
                  />

                  <BooleanQuestion
                    value={formData.will_apply_learning}
                    onChange={(value) => handleBooleanChange('will_apply_learning', value)}
                    label="Will you apply what you learned?"
                  />

                  <BooleanQuestion
                    value={formData.will_recommend_training}
                    onChange={(value) => handleBooleanChange('will_recommend_training', value)}
                    label="Would you recommend this training?"
                  />

                  <BooleanQuestion
                    value={formData.would_attend_future_training}
                    onChange={(value) => handleBooleanChange('would_attend_future_training', value)}
                    label="Would you attend future TaRL training?"
                  />

                  <BooleanQuestion
                    value={formData.training_duration_appropriate}
                    onChange={(value) => handleBooleanChange('training_duration_appropriate', value)}
                    label="Was the training duration appropriate?"
                  />

                  <BooleanQuestion
                    value={formData.pace_appropriate}
                    onChange={(value) => handleBooleanChange('pace_appropriate', value)}
                    label="Was the training pace appropriate?"
                  />
                </div>
              </div>

              {/* Text Feedback */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Additional Feedback</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="valuable">Most valuable aspect</Label>
                    <Textarea
                      id="valuable"
                      placeholder="What was the most valuable part of this training?"
                      value={formData.most_valuable_aspect}
                      onChange={(e) => handleInputChange('most_valuable_aspect', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="least-valuable">Least valuable aspect</Label>
                    <Textarea
                      id="least-valuable"
                      placeholder="What could be improved or was least helpful?"
                      value={formData.least_valuable_aspect}
                      onChange={(e) => handleInputChange('least_valuable_aspect', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="additional-topics">Additional topics needed</Label>
                    <Textarea
                      id="additional-topics"
                      placeholder="What topics would you like to see covered in future training?"
                      value={formData.additional_topics_needed}
                      onChange={(e) => handleInputChange('additional_topics_needed', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="challenges">Implementation challenges</Label>
                    <Textarea
                      id="challenges"
                      placeholder="What challenges do you anticipate in implementing what you learned?"
                      value={formData.challenges_implementing}
                      onChange={(e) => handleInputChange('challenges_implementing', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="suggestions">Suggestions for improvement</Label>
                  <Textarea
                    id="suggestions"
                    placeholder="How can we improve this training program?"
                    value={formData.suggestions_for_improvement}
                    onChange={(e) => handleInputChange('suggestions_for_improvement', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="comments">Additional comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Any other feedback or comments you'd like to share?"
                    value={formData.additional_comments}
                    onChange={(e) => handleInputChange('additional_comments', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Optional Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Providing your contact information allows us to follow up if needed.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="respondent-name">Your Name</Label>
                    <Input
                      id="respondent-name"
                      placeholder="Your full name (optional)"
                      value={formData.respondent_name}
                      onChange={(e) => handleInputChange('respondent_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="respondent-email">Email Address</Label>
                    <Input
                      id="respondent-email"
                      type="email"
                      placeholder="your.email@example.com (optional)"
                      value={formData.respondent_email}
                      onChange={(e) => handleInputChange('respondent_email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting Feedback...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Your feedback is valuable and helps us improve our training programs.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}