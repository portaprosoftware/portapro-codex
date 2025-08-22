
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { normalizeZip } from '@/lib/tax';

type ParsedRow = { zip_code: string; tax_rate: number };

function to5(zip: string | undefined): string | undefined {
  const z = normalizeZip(zip);
  if (!z) return undefined;
  return z.padStart(5, '0').slice(0, 5);
}

function parseRate(input: string): number | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;
  // Accept "8.875%", "8.875", or "0.08875"
  if (raw.endsWith('%')) {
    const n = Number(raw.replace('%', '').trim());
    return isFinite(n) ? n / 100 : null;
  }
  const n = Number(raw);
  if (!isFinite(n)) return null;
  // Heuristic: values > 1 are treated as percent
  return n > 1 ? n / 100 : n;
}

function parseCSV(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Try CSV first
    const parts = line.split(',').map(p => p.trim()).filter(Boolean);
    let zip: string | undefined;
    let rateStr: string | undefined;

    if (parts.length >= 2) {
      zip = parts[0];
      rateStr = parts[1];
    } else {
      // Support space-separated "44107 8.00" or "44107 0.08"
      const segs = line.split(/\s+/).map(p => p.trim()).filter(Boolean);
      if (segs.length >= 2) {
        zip = segs[0];
        rateStr = segs[1];
      }
    }

    const zip5 = to5(zip);
    const rate = parseRate(rateStr || '');

    if (zip5 && rate != null) {
      rows.push({ zip_code: zip5, tax_rate: rate });
    }
  }
  return rows;
}

async function upsertInBatches(rows: ParsedRow[], batchSize = 500) {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('tax_rates')
      .upsert(chunk as any, { onConflict: 'zip_code' }); // requires unique index on zip_code (already added)
    if (error) {
      throw error;
    }
    total += chunk.length;
  }
  return total;
}

interface TaxRatesImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultZip?: string;
}

export const TaxRatesImportDialog: React.FC<TaxRatesImportDialogProps> = ({ open, onOpenChange, defaultZip }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => parseCSV(text), [text]);
  const sample = useMemo(
    () => (defaultZip ? `${defaultZip}, 8.75%` : '10001, 8.875%\n30301, 8.90%\n73301, 8.25%\n90210, 9.50%'),
    [defaultZip]
  );

  const handleFile = async (f: File | null) => {
    if (!f) return;
    const content = await f.text();
    setText(content);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No valid rows found. Please paste lines like "44107, 8.00%" or "44107, 0.08".');
      return;
    }
    setBusy(true);
    console.log('[TaxRatesImportDialog] importing rows:', preview.length);
    try {
      const inserted = await upsertInBatches(preview);
      toast.success(`Imported ${inserted} ZIP tax rate(s).`);
      onOpenChange(false);
    } catch (e: any) {
      console.error('[TaxRatesImportDialog] import error', e);
      toast.error(e?.message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import ZIP Sales Tax Rates</DialogTitle>
          <DialogDescription>
            Paste or upload a CSV/TSV with columns: ZIP, tax_rate. Rates can be percentages (e.g., 8.875%) or decimals (0.08875).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload CSV (optional)</Label>
            <Input
              type="file"
              accept=".csv,text/csv,text/plain"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paste rows</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setText(sample)}
                disabled={busy}
              >
                Load example
              </Button>
            </div>
            <Textarea
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="44107, 8.00%
10001, 8.875%
07030, 6.625%"
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              Recognizes formats like "44107, 8.00%", "44107, 8.00", or "44107, 0.08". ZIP+4 is supported; we only keep the first 5 digits.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Parsed rows: <span className="font-medium text-foreground">{preview.length}</span>
            </div>
            <Button
              type="button"
              onClick={handleImport}
              disabled={busy || preview.length === 0}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
            >
              {busy ? 'Importing…' : 'Import tax rates'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
