
import React, { useState } from "react";
import { QrCode, Eye, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface QRCodeDropdownProps {
  itemCode: string;
  qrCodeData?: string;
}

export const QRCodeDropdown: React.FC<QRCodeDropdownProps> = ({ itemCode, qrCodeData }) => {
  const handleViewQR = () => {
    // TODO: Implement QR code viewing modal
    console.log("View QR code for", itemCode);
  };

  const handleDownloadQR = () => {
    // TODO: Implement QR code download
    console.log("Download QR code for", itemCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
          <QrCode className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
        <DropdownMenuItem onClick={handleViewQR} className="flex items-center gap-2 cursor-pointer">
          <Eye className="w-4 h-4" />
          View QR Code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadQR} className="flex items-center gap-2 cursor-pointer">
          <Download className="w-4 h-4" />
          Download QR Code
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
