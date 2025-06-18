"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Star,
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
  trainer_name?: string;
}

export default function TrainingFeedbackPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const qrId = searchParams.get('qr');
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    // Participant Info
    respondent_name: '',
    respondent_email: '',
    respondent_role: '',
    school_name: '',
    years_of_experience: '',
    
    // Ratings (1-5 scale)
    overall_rating: '',
    content_quality_rating: '',
    trainer_effectiveness_rating: '',
    venue_rating: '',
    materials_rating: '',
    
    // Yes/No Questions
    objectives_met: '',
    will_apply_learning: '',
    will_recommend_training: '',
    would_attend_future_training: '',
    training_duration_appropriate: '',
    materials_helpful: '',
    pace_appropriate: '',
    previous_tarl_training: '',
    
    // Open Text
    most_valuable_aspect: '',
    least_valuable_aspect: '',
    additional_topics_needed: '',
    suggestions_for_improvement: '',
    challenges_implementing: '',
    additional_comments: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions?id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSession(data[0]);
        } else {
          toast.error('Training session not found');
        }
      } else {
        toast.error('Failed to load session information');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Error loading session');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.respondent_name || !formData.overall_rating) {
      toast.error('Please provide your name and overall rating');
      return;
    }

    if (!sessionId || !session) {
      toast.error('Invalid session');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload to match the API expected structure
      const apiPayload = {
        session_id: sessionId,
        feedback_data: formData,
        overall_rating: parseInt(formData.overall_rating) || null,
        trainer_rating: parseInt(formData.trainer_effectiveness_rating) || null,
        content_rating: parseInt(formData.content_quality_rating) || null,
        venue_rating: parseInt(formData.venue_rating) || null,
        would_recommend: formData.will_recommend_training === 'yes' ? true : formData.will_recommend_training === 'no' ? false : null,
        comments: formData.most_valuable_aspect || formData.additional_comments || null,
        suggestions: formData.suggestions_for_improvement || null,
        submitted_via: 'qr_code',
        is_anonymous: !formData.respondent_email
      };

      const response = await fetch('/api/training/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success('Feedback submitted successfully!');
        
        // Log QR code usage
        if (qrId) {
          await fetch(`/api/training/qr-codes?qr_id=${qrId}&session_id=${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action_type: 'feedback',
              user_agent: navigator.userAgent,
              scan_data: { 
                respondent_email: formData.respondent_email,
                overall_rating: formData.overall_rating
              }
            })
          });
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, disabled = false }: { 
    value: string; 
    onChange: (value: string) => void; 
    disabled?: boolean;
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating.toString())}
            disabled={disabled}
            className={`p-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Star 
              className={`h-6 w-6 ${
                parseInt(value) >= rating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600">The training session could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your feedback for <strong>{session.session_title}</strong> has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              Your input helps us improve our training programs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-purple-600 rounded-full p-3 inline-flex mb-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Training Feedback</h1>
          <p className="text-gray-600 mt-1">Share your experience with us</p>
        </div>

        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{session.session_title}</CardTitle>
            <p className="text-sm text-gray-600">{session.program_name}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {formatDate(session.session_date)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                {formatTime(session.session_time)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                {session.location}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respondent_name">Name *</Label>
                  <Input
                    id="respondent_name"
                    value={formData.respondent_name}
                    onChange={(e) => handleInputChange('respondent_name', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="respondent_email">Email</Label>
                  <Input
                    id="respondent_email"
                    type="email"
                    value={formData.respondent_email}
                    onChange={(e) => handleInputChange('respondent_email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="respondent_role">Your Role</Label>
                  <Select value={formData.respondent_role} onValueChange={(value) => handleInputChange('respondent_role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.years_of_experience}
                    onChange={(e) => handleInputChange('years_of_experience', e.target.value)}
                    placeholder="Years"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_name">School Name</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => handleInputChange('school_name', e.target.value)}
                  placeholder="Your school name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card>
            <CardHeader>
              <CardTitle>Training Ratings</CardTitle>
              <p className="text-sm text-gray-600">Rate each aspect from 1 (poor) to 5 (excellent)</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Overall Training Quality *</Label>
                <StarRating 
                  value={formData.overall_rating} 
                  onChange={(value) => handleInputChange('overall_rating', value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Content Quality</Label>
                <StarRating 
                  value={formData.content_quality_rating} 
                  onChange={(value) => handleInputChange('content_quality_rating', value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Trainer Effectiveness</Label>
                <StarRating 
                  value={formData.trainer_effectiveness_rating} 
                  onChange={(value) => handleInputChange('trainer_effectiveness_rating', value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Venue & Facilities</Label>
                <StarRating 
                  value={formData.venue_rating} 
                  onChange={(value) => handleInputChange('venue_rating', value)} 
                />
              </div>

              <div className="space-y-2">
                <Label>Training Materials</Label>
                <StarRating 
                  value={formData.materials_rating} 
                  onChange={(value) => handleInputChange('materials_rating', value)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Yes/No Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Training Effectiveness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { field: 'objectives_met', label: 'Were the training objectives met?' },
                { field: 'will_apply_learning', label: 'Will you apply what you learned?' },
                { field: 'will_recommend_training', label: 'Would you recommend this training to others?' },
                { field: 'would_attend_future_training', label: 'Would you attend future TaRL trainings?' },
                { field: 'training_duration_appropriate', label: 'Was the training duration appropriate?' },
                { field: 'materials_helpful', label: 'Were the training materials helpful?' },
                { field: 'pace_appropriate', label: 'Was the training pace appropriate?' },
                { field: 'previous_tarl_training', label: 'Have you attended TaRL training before?' }
              ].map((question) => (
                <div key={question.field} className="space-y-3">
                  <Label>{question.label}</Label>
                  <RadioGroup 
                    value={formData[question.field as keyof typeof formData] as string} 
                    onValueChange={(value) => handleInputChange(question.field, value)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id={`${question.field}-yes`} />
                      <Label htmlFor={`${question.field}-yes`} className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4 text-green-600" />
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${question.field}-no`} />
                      <Label htmlFor={`${question.field}-no`} className="flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4 text-red-600" />
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Open Text Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="most_valuable_aspect">What was the most valuable aspect of this training?</Label>
                <Textarea
                  id="most_valuable_aspect"
                  value={formData.most_valuable_aspect}
                  onChange={(e) => handleInputChange('most_valuable_aspect', e.target.value)}
                  placeholder="Share what you found most useful..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestions_for_improvement">How can we improve this training?</Label>
                <Textarea
                  id="suggestions_for_improvement"
                  value={formData.suggestions_for_improvement}
                  onChange={(e) => handleInputChange('suggestions_for_improvement', e.target.value)}
                  placeholder="Your suggestions for improvement..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_topics_needed">What additional topics would you like to see covered?</Label>
                <Textarea
                  id="additional_topics_needed"
                  value={formData.additional_topics_needed}
                  onChange={(e) => handleInputChange('additional_topics_needed', e.target.value)}
                  placeholder="Topics for future training sessions..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_comments">Any other comments?</Label>
                <Textarea
                  id="additional_comments"
                  value={formData.additional_comments}
                  onChange={(e) => handleInputChange('additional_comments', e.target.value)}
                  placeholder="Additional feedback or comments..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="p-6">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
                size="lg"
              >
                {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Thank you for taking the time to provide your feedback
        </p>
      </div>
    </div>
  );
}