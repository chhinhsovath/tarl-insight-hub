"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface MaterialsQRCodeProps {
  sessionId: number;
  sessionTitle: string;
}

export function MaterialsQRCode({ sessionId, sessionTitle }: MaterialsQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const materialsUrl = `${window.location.origin}/training/session/${sessionId}/materials`;

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code using a QR code API or library with larger size
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(materialsUrl)}`;
      setQrCodeUrl(qrApiUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(materialsUrl);
      toast.success("URL copied to clipboard");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy URL");
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `materials-qr-${sessionId}.png`;
    link.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={generateQRCode}>
          <QrCode className="h-4 w-4 mr-2" />
          Materials QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Training Materials Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <p className="text-base text-muted-foreground mb-3">
              Share this QR code with participants to give them easy access to training materials
            </p>
            <p className="text-lg font-medium">{sessionTitle}</p>
          </div>
          
          {qrCodeUrl && (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code for Materials Access" 
                  className="mx-auto mb-6"
                  style={{ width: '350px', height: '350px' }}
                />
                <div className="flex gap-3 justify-center">
                  <Button size="default" variant="outline" onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Button size="default" variant="outline" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <p className="text-base font-medium">Direct URL:</p>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <code className="text-sm flex-1 break-all">
                {materialsUrl}
              </code>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="secondary" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => window.open(materialsUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>Participants can access materials anytime</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>No login required for material downloads</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">•</span>
              <span>Download tracking is automatically enabled</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}