"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEventFromImport } from "@/lib/actions/create-event-from-import";

type Category = { id: string; name: string };

type ExtractedEvent = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  locationName: string;
  address: string;
  cost: string;
  ticketUrl: string;
  categoryId: string;
};

type FlyerCard = {
  id: string;
  file: File;
  preview: string;
  status: "idle" | "uploading" | "extracting" | "done" | "error";
  imageUrl?: string;
  extracted?: Partial<ExtractedEvent>;
  saved?: boolean;
  error?: string;
};

export default function ImportFlyersClient({
  tenantId,
  tenantSlug,
  categories,
}: {
  tenantId: string;
  tenantSlug: string;
  categories: Category[];
}) {
  const [cards, setCards] = useState<FlyerCard[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const updateCard = (id: string, updates: Partial<FlyerCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const updateExtracted = (id: string, field: keyof ExtractedEvent, value: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, extracted: { ...c.extracted, [field]: value } } : c
      )
    );
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newCards: FlyerCard[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "idle" as const,
      }));

    setCards((prev) => [...prev, ...newCards]);

    for (const card of newCards) {
      updateCard(card.id, { status: "uploading" });
      let imageUrl: string | undefined;

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: card.file.name, contentType: card.file.type }),
        });

        if (!res.ok) throw new Error("upload-url-failed");

        const { uploadUrl, publicUrl } = (await res.json()) as {
          uploadUrl: string;
          publicUrl: string;
        };

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: card.file,
          headers: { "Content-Type": card.file.type },
        });

        if (!uploadRes.ok) throw new Error("upload-failed");

        imageUrl = publicUrl;
        updateCard(card.id, { imageUrl });
      } catch {
        updateCard(card.id, { status: "error", error: "Upload failed" });
        continue;
      }

      updateCard(card.id, { status: "extracting" });
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
          reader.onerror = () => reject(new Error("read-failed"));
          reader.readAsDataURL(card.file);
        });

        const extractRes = await fetch("/api/extract-flyer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            mediaType: card.file.type,
            tenantSlug,
          }),
        });

        if (!extractRes.ok) throw new Error("extract-failed");

        const extracted = (await extractRes.json()) as Partial<ExtractedEvent>;
        updateCard(card.id, { status: "done", extracted });
      } catch {
        updateCard(card.id, { status: "error", error: "AI extraction failed" });
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const saveCard = async (card: FlyerCard) => {
    if (!card.extracted?.title || !card.extracted?.startAt) return;
    updateCard(card.id, { status: "uploading" });

    try {
      await createEventFromImport({
        tenantId,
        title: card.extracted.title ?? "",
        description: card.extracted.description,
        startAt: card.extracted.startAt ?? "",
        endAt: card.extracted.endAt,
        locationName: card.extracted.locationName,
        address: card.extracted.address,
        cost: card.extracted.cost,
        ticketUrl: card.extracted.ticketUrl,
        categoryId: card.extracted.categoryId,
        imageUrl: card.imageUrl,
      });
      updateCard(card.id, { saved: true, status: "done" });
    } catch {
      updateCard(card.id, { status: "error", error: "Failed to save" });
    }
  };

  const saveAll = async () => {
    const unsaved = cards.filter((c) => c.status === "done" && !c.saved);
    for (const card of unsaved) {
      await saveCard(card);
    }
  };

  const readyCount = cards.filter((c) => c.status === "done" && !c.saved).length;
  const savedCount = cards.filter((c) => c.saved).length;

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center transition-colors hover:border-gray-300 hover:bg-gray-50"
        onClick={() => document.getElementById("flyer-input")?.click()}
      >
        <div className="mb-3 text-4xl">IMG</div>
        <p className="text-sm font-medium text-gray-700">Drop flyers here or click to upload</p>
        <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP - multiple files supported</p>
        <input
          id="flyer-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {readyCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-700">
            {readyCount} event{readyCount !== 1 ? "s" : ""} ready to publish
          </p>
          <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={saveAll}>
            Publish all -&gt;
          </Button>
        </div>
      )}

      {savedCount > 0 && readyCount === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">
            {`OK ${savedCount} event${savedCount !== 1 ? "s" : ""} published to calendar`}
          </p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div
                className="relative cursor-zoom-in overflow-hidden bg-gray-100"
                style={{ height: "180px" }}
                onClick={() => setLightbox(card.preview)}
              >
                <img
                  src={card.preview}
                  alt="Flyer"
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
                {card.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="ml-2 text-sm text-white">Uploading...</span>
                  </div>
                )}
                {card.status === "extracting" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    <span className="ml-2 text-sm text-white">Reading with AI...</span>
                  </div>
                )}
                {card.saved && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-600/70">
                    <span className="text-sm font-medium text-white">Published</span>
                  </div>
                )}
              </div>

              {card.status === "done" && card.extracted && !card.saved && (
                <div className="space-y-3 p-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Title *</Label>
                    <Input
                      value={card.extracted.title ?? ""}
                      onChange={(e) => updateExtracted(card.id, "title", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={card.extracted.description ?? ""}
                      onChange={(e) => updateExtracted(card.id, "description", e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Start *</Label>
                      <Input
                        type="datetime-local"
                        value={card.extracted.startAt ?? ""}
                        onChange={(e) => updateExtracted(card.id, "startAt", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End</Label>
                      <Input
                        type="datetime-local"
                        value={card.extracted.endAt ?? ""}
                        onChange={(e) => updateExtracted(card.id, "endAt", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Venue</Label>
                    <Input
                      value={card.extracted.locationName ?? ""}
                      onChange={(e) => updateExtracted(card.id, "locationName", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Address</Label>
                    <Input
                      value={card.extracted.address ?? ""}
                      onChange={(e) => updateExtracted(card.id, "address", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cost</Label>
                      <Input
                        value={card.extracted.cost ?? ""}
                        onChange={(e) => updateExtracted(card.id, "cost", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={card.extracted.categoryId ?? ""}
                        onValueChange={(v) =>
                          updateExtracted(
                            card.id,
                            "categoryId",
                            typeof v === "string" ? v : ""
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pick..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Ticket URL</Label>
                    <Input
                      value={card.extracted.ticketUrl ?? ""}
                      onChange={(e) => updateExtracted(card.id, "ticketUrl", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <Button
                    className="w-full bg-green-600 text-white hover:bg-green-700"
                    onClick={() => saveCard(card)}
                    disabled={!card.extracted.title || !card.extracted.startAt}
                  >
                    Publish to calendar
                  </Button>
                </div>
              )}

              {card.status === "error" && (
                <div className="p-4">
                  <p className="text-sm text-red-500">{card.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white opacity-80 hover:opacity-100"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt="Flyer"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
