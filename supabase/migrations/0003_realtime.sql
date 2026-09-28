-- The inbox listens for new messages instead of polling. Supabase only streams
-- tables that are in the `supabase_realtime` publication, and adding a table
-- twice is an error, so each add is guarded.
--
-- RLS still applies to the stream: a browser holding only the anon key and no
-- session receives nothing.
do $$
begin
  begin
    alter publication supabase_realtime add table messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table conversations;
  exception when duplicate_object then null;
  end;
end $$;
