"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { importFromICS, exportToICS, importFromCSV, exportToCSV } from "../lib/calendar";
import { UploadIcon, DownloadIcon, CheckIcon, AlertCircleIcon, XIcon, FileTextIcon, CalendarIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useActiveConnection } from "@/hooks/use-connections";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportExportDialog({ open, onOpenChange, onSuccess }: ImportExportDialogProps) {
  const activeConnection = useActiveConnection();
  const activeUserId = activeConnection.data?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("import");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [importFormat, setImportFormat] = useState<"ics" | "csv">("ics");
  const [exportFormat, setExportFormat] = useState<"ics" | "csv">("ics");
  const [exportOption, setExportOption] = useState<"all" | "range">("range");
  const [importResults, setImportResults] = useState<{ imported: number; errors: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      const fileName = e.target.files[0].name.toLowerCase();
      if (fileName.endsWith(".ics") || fileName.endsWith(".ical")) {
        setImportFormat("ics");
      } else if (fileName.endsWith(".csv")) {
        setImportFormat("csv");
      }
    }
  };

  const handleImport = async () => {
    if (!file || !activeUserId) return;
    setIsProcessing(true);
    setImportResults(null);
    try {
      const fileContent = await file.text();
      let result;
      if (importFormat === "ics") {
        result = await importFromICS(activeUserId, fileContent);
      } else {
        result = await importFromCSV(activeUserId, fileContent);
      }
      setImportResults(result);
      if (result.imported > 0) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.imported} events${result.errors > 0 ? ` (${result.errors} errors)` : ""}`,
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Import failed",
          description: "Failed to import events. Please check the file format and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Import failed", description: "An error occurred while importing events", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!activeUserId) return;
    setIsProcessing(true);
    try {
      const startDate = exportOption === "all" ? new Date(0) : new Date(dateRange.start);
      const endDate = exportOption === "all" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(dateRange.end);
      let content: string;
      let fileExtension: string;
      let mimeType: string;
      if (exportFormat === "ics") {
        content = await exportToICS(activeUserId, startDate, endDate);
        fileExtension = "ics";
        mimeType = "text/calendar";
      } else {
        content = await exportToCSV(activeUserId, startDate, endDate);
        fileExtension = "csv";
        mimeType = "text/csv";
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zero-calendar-export-${new Date().toISOString().split("T")[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export successful", description: `Your calendar has been exported to ${exportFormat.toUpperCase()} format successfully` });
    } catch (error) {
      toast({ title: "Export failed", description: "An error occurred while exporting events", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import/Export Calendar</DialogTitle>
          <DialogDescription>Import events from an ICS/CSV file or export your calendar</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="import-format">Import Format</Label>
                <div className="flex items-center space-x-2">
                  <button type="button" className={`px-3 py-1 text-sm rounded-md ${importFormat === "ics" ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900" : "bg-mono-100 text-mono-700 dark:bg-mono-800 dark:text-mono-300"}`} onClick={() => setImportFormat("ics")}>
                    ICS
                  </button>
                  <button type="button" className={`px-3 py-1 text-sm rounded-md ${importFormat === "csv" ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900" : "bg-mono-100 text-mono-700 dark:bg-mono-800 dark:text-mono-300"}`} onClick={() => setImportFormat("csv")}>
                    CSV
                  </button>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    {importFormat === "ics" ? <CalendarIcon className="h-8 w-8 text-mono-500" /> : <FileTextIcon className="h-8 w-8 text-mono-500" />}
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-mono-500">{(file.size / 1024).toFixed(2)} KB</p>
                    <Button variant="outline" size="sm" onClick={() => setFile(null)} className="mt-2">
                      <XIcon className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadIcon className="h-8 w-8 text-mono-500" />
                    <p className="text-sm">Drag and drop your {importFormat.toUpperCase()} file here, or click to browse</p>
                    <Input id="import-file" type="file" accept={importFormat === "ics" ? ".ics,.ical" : ".csv"} onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()} className="mt-2">
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>

              {importFormat === "csv" && (
                <div className="rounded-lg bg-mono-100 dark:bg-mono-800 p-3 text-sm">
                  <h4 className="font-medium mb-1">CSV Format Requirements:</h4>
                  <p className="mb-2">Your CSV file should include these columns:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Subject/Title (required)</li>
                    <li>Start Date (required, format: MM/DD/YYYY)</li>
                    <li>Start Time (optional, format: HH:MM)</li>
                    <li>End Date (optional)</li>
                    <li>End Time (optional)</li>
                    <li>All Day (optional, TRUE/FALSE)</li>
                    <li>Description (optional)</li>
                    <li>Location (optional)</li>
                    <li>Categories (optional)</li>
                  </ul>
                </div>
              )}

              {importResults && (
                <div className={`rounded-lg p-3 text-sm ${importResults.errors > 0 ? "bg-mono-100 dark:bg-mono-800" : "bg-mono-100 dark:bg-mono-800"}`}>
                  <h4 className="font-medium mb-1">Import Results:</h4>
                  <p>Successfully imported: <span className="font-medium">{importResults.imported}</span> events</p>
                  {importResults.errors > 0 && <p>Errors: <span className="font-medium">{importResults.errors}</span> events</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || isProcessing} className="gap-2">
                {isProcessing ? <>Processing...</> : (<><CheckIcon className="h-4 w-4" />Import Events</>)}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="export-format">Export Format</Label>
                <div className="flex items-center space-x-2">
                  <button type="button" className={`px-3 py-1 text-sm rounded-md ${exportFormat === "ics" ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900" : "bg-mono-100 text-mono-700 dark:bg-mono-800 dark:text-mono-300"}`} onClick={() => setExportFormat("ics")}>
                    ICS
                  </button>
                  <button type="button" className={`px-3 py-1 text-sm rounded-md ${exportFormat === "csv" ? "bg-mono-900 text-mono-50 dark:bg-mono-50 dark:text-mono-900" : "bg-mono-100 text-mono-700 dark:bg-mono-800 dark:text-mono-300"}`} onClick={() => setExportFormat("csv")}>
                    CSV
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Range</Label>
                <RadioGroup value={exportOption} onValueChange={(value) => setExportOption(value as "all" | "range") }>
                  <div className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value="all" id="export-all" />
                    <label htmlFor="export-all" className="text-sm">All events</label>
                  </div>
                  <div className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value="range" id="export-range" />
                    <label htmlFor="export-range" className="text-sm">Date range</label>
                  </div>
                </RadioGroup>
              </div>

              {exportOption === "range" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="export-start">Start Date</Label>
                    <Input id="export-start" type="date" value={dateRange.start} onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-end">End Date</Label>
                    <Input id="export-end" type="date" value={dateRange.end} onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))} />
                  </div>
                </>
              )}

              <div className="rounded-lg bg-mono-100 dark:bg-mono-800 p-3 text-sm flex items-start gap-2">
                <AlertCircleIcon className="h-5 w-5 text-mono-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="mb-1">This will export {exportOption === "all" ? "all your events" : "events between the selected dates"} in {exportFormat.toUpperCase()} format.</p>
                  <p className="text-xs text-mono-500">{exportFormat === "ics" ? "ICS files can be imported into most calendar applications like Google Calendar, Apple Calendar, or Outlook." : "CSV files can be opened in spreadsheet applications like Excel or Google Sheets."}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={isProcessing} className="gap-2">
                {isProcessing ? <>Processing...</> : (<><DownloadIcon className="h-4 w-4" />Export Calendar</>)}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
