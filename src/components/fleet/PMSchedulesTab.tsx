import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const PMSchedulesTab: React.FC = () => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [miles, setMiles] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pm-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pm_schedules").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const add = async () => {
    if (!name) return;
    try {
      const { error } = await supabase.from("pm_schedules").insert({ name, trigger_miles_every: miles ? Number(miles) : null });
      if (error) throw error;
      setAdding(false); setName(""); setMiles("");
      refetch();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">PM Schedules</h2>
        {!adding ? (
          <Button onClick={()=>setAdding(true)}>New Schedule</Button>
        ) : (
          <div className="flex items-center gap-2">
            <input className="border rounded-md p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border rounded-md p-2 w-32" placeholder="Miles" value={miles} onChange={e=>setMiles(e.target.value)} />
            <Button onClick={add}>Save</Button>
            <Button variant="outline" onClick={()=>{setAdding(false); setName(""); setMiles("");}}>Cancel</Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (data || []).length === 0 ? (
            <p className="text-gray-500">No schedules yet</p>
          ) : (
            <ul className="divide-y">
              {(data || []).map((s:any)=> (
                <li key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-600">Miles every: {s.trigger_miles_every ?? '—'}</div>
                  </div>
                  <div className="text-xs text-gray-500">Created {new Date(s.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};