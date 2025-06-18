"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  QrCode,
  Camera,
  CheckCircle2, 
  Clock,
  MapPin,
  AlertCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Users
} from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  session_title: string;
  session_date: string;
  start_time: string;
  location: string;
  current_attendance: number;
  capacity: number;
}

interface ScanResult {
  participant_name: string;
  participant_email: string;
  status: 'success' | 'already_checked' | 'not_found' | 'error';
  message: string;
}

export default function QRCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    fetchSession();
    return () => {
      stopCamera();
    };
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      toast.error("Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        startScanning();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  const startScanning = () => {
    setScanning(true);
    scanForQRCode();
  };

  const scanForQRCode = async () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Here you would typically use a QR code library like jsQR
      // For now, we'll simulate QR code detection
      // In a real implementation, you'd do:
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // Simulate QR code detection (replace with actual QR code library)
      await simulateQRDetection();
      
    } catch (error) {
      console.error("Error scanning QR code:", error);
    }

    // Continue scanning if camera is still active
    if (scanning) {
      setTimeout(scanForQRCode, 100); // Scan every 100ms
    }
  };

  const simulateQRDetection = async () => {
    // This is a placeholder - replace with actual QR code scanning
    // For demo purposes, we'll show how it would work
    
    // In real implementation, you'd extract QR code data and call processQRCode
    // const qrData = extractedQRCodeData;
    // await processQRCode(qrData);
  };

  const processQRCode = async (qrData: string) => {
    try {
      // Parse QR code data (assuming it contains participant info or registration ID)
      let participantData;
      
      try {
        participantData = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as registration ID or email
        participantData = { identifier: qrData };
      }

      const response = await fetch(`/api/training/sessions/${sessionId}/qr-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(participantData)
      });

      if (response.ok) {
        const result = await response.json();
        const scanResult: ScanResult = {
          participant_name: result.participant_name,
          participant_email: result.participant_email,
          status: result.status,
          message: result.message
        };
        
        setRecentScans(prev => [scanResult, ...prev.slice(0, 9)]); // Keep last 10 scans
        setScanCount(prev => prev + 1);
        
        if (result.status === 'success') {
          toast.success(`✅ ${result.participant_name} checked in successfully`);
          fetchSession(); // Refresh attendance count
        } else if (result.status === 'already_checked') {
          toast.info(`ℹ️ ${result.participant_name} already checked in`);
        } else {
          toast.error(result.message);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to process QR code");
      }
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast.error("Failed to process QR code");
    }
  };

  const handleManualEntry = () => {
    // For testing purposes - simulate a successful scan
    const mockResult: ScanResult = {
      participant_name: "Test Participant",
      participant_email: "test@example.com",
      status: 'success',
      message: "Check-in successful"
    };
    setRecentScans(prev => [mockResult, ...prev.slice(0, 9)]);
    setScanCount(prev => prev + 1);
    toast.success("✅ Test participant checked in");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Session not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">QR Code Check-in</h1>
            <p className="text-muted-foreground">Scan QR codes for quick attendance</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">{session.session_title}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(session.session_date).toLocaleDateString()} at {session.start_time}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {session.location}
            </div>
            <Badge variant={session.current_attendance >= session.capacity ? "destructive" : "default"}>
              {session.current_attendance} / {session.capacity} Attendees
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              QR Scanner
            </CardTitle>
            <CardDescription>
              Position QR codes within the camera view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!cameraActive ? (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Camera not active</p>
                    <Button onClick={startCamera}>
                      Start Camera
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-video rounded-lg bg-black"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
                    </div>
                  </div>
                  
                  {scanning && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Scanning...
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {cameraActive ? (
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                ) : (
                  <Button onClick={startCamera} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                )}
                
                {/* Test button for demo */}
                <Button onClick={handleManualEntry} variant="outline">
                  Test Scan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Scans
              </span>
              <Badge variant="outline">
                {scanCount} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scans yet</p>
                <p className="text-sm">Start scanning QR codes to see results here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      scan.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : scan.status === 'already_checked'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{scan.participant_name}</h4>
                        <p className="text-sm text-muted-foreground">{scan.participant_email}</p>
                        <p className="text-sm mt-1">{scan.message}</p>
                      </div>
                      <Badge 
                        variant={scan.status === 'success' ? 'default' : 'secondary'}
                        className={
                          scan.status === 'success' 
                            ? 'bg-green-600' 
                            : scan.status === 'already_checked'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }
                      >
                        {scan.status === 'success' ? 'Checked In' : 
                         scan.status === 'already_checked' ? 'Already In' : 'Error'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Start Camera</p>
                <p className="text-muted-foreground">Click "Start Camera" and allow camera permissions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Position QR Code</p>
                <p className="text-muted-foreground">Hold QR code within the scanning area</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Automatic Check-in</p>
                <p className="text-muted-foreground">Attendance will be marked automatically when detected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}