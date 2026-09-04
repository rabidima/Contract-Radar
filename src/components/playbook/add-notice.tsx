import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { NAICS } from "@/lib/playbook/naics";
import { usePlaybook } from "@/lib/playbook/store";
import { NOTICE_LABEL, SET_ASIDE_LABEL, type NoticeType, type SetAside } from "@/lib/playbook/types";

export function AddNoticeButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === "outline" ? "outline" : "default"}>Add SAM notice</Button>
      </DialogTrigger>
      <DialogContent title="Log a notice" className="max-h-[90dvh] overflow-y-auto">
        <AddNoticeForm
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddNoticeForm({ onDone }: { onDone: () => void }) {
  const add = usePlaybook((s) => s.addOpportunity);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [noticeId, setNoticeId] = useState("");
  const [agency, setAgency] = useState("");
  const [naics, setNaics] = useState("541512");
  const [noticeType, setNoticeType] = useState<NoticeType>("solicitation");
  const [setAside, setSetAside] = useState<SetAside>("total-sb");
  const [dueAt, setDueAt] = useState("");
  const [estValue, setEstValue] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !agency.trim()) return;
    const due = dueAt ? new Date(dueAt).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString();
    const id = add({
      title: title.trim(),
      noticeId: noticeId.trim() || "UNASSIGNED",
      agency: agency.trim(),
      naics,
      noticeType,
      setAside,
      postedAt: new Date().toISOString(),
      dueAt: due,
      estValue: estValue ? Number(estValue) : undefined,
      place: place.trim() || undefined,
      notes: notes.trim(),
    });
    onDone();
    void navigate({ to: "/opportunity/$id", params: { id } });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="title">Notice title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enterprise service desk…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="nid">Notice / solicitation ID</Label>
          <Input id="nid" value={noticeId} onChange={(e) => setNoticeId(e.target.value)} placeholder="W91RUS26R0041" className="font-mono" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="agency">Agency</Label>
          <Input id="agency" required value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Department of the Army" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="type">Notice type</Label>
          <Select id="type" value={noticeType} onChange={(e) => setNoticeType(e.target.value as NoticeType)}>
            {Object.entries(NOTICE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sa">Set-aside</Label>
          <Select id="sa" value={setAside} onChange={(e) => setSetAside(e.target.value as SetAside)}>
            {Object.entries(SET_ASIDE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="naics">NAICS</Label>
          <Select id="naics" value={naics} onChange={(e) => setNaics(e.target.value)}>
            {NAICS.map((n) => (
              <option key={n.code} value={n.code}>{n.code} — {n.title}</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="due">Response due</Label>
          <Input id="due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="val">Est. value (USD)</Label>
          <Input id="val" inputMode="numeric" value={estValue} onChange={(e) => setEstValue(e.target.value)} placeholder="48000000" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="place">Place of performance</Label>
          <Input id="place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="CONUS / remote" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Desk notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Incumbent, vehicle, anything the 90-second sort caught." />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="submit">File on the desk</Button>
      </div>
    </form>
  );
}
