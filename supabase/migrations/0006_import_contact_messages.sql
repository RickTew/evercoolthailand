-- Fold the website contact-form Messages into the CRM (Rick, 13 Jul): every
-- historical contact_messages row becomes a CRM ticket, and the contact API
-- now opens tickets directly for new submissions. Idempotent: each imported
-- message carries provider_message_id 'webform:<contact_messages.id>', so
-- re-running skips existing imports. contact_messages itself is kept as the
-- pre-CRM archive (/admin/messages stays reachable by URL, off the nav).
do $mig$
declare
  cm record;
  v_email text;
  v_contact uuid;
  v_thread uuid;
begin
  for cm in select * from public.contact_messages order by created_at loop
    if exists (select 1 from public.support_messages where provider_message_id = 'webform:' || cm.id) then
      continue;
    end if;

    v_email := lower(trim(coalesce(cm.email, '')));
    if v_email = '' then
      v_email := 'phone-' || coalesce(nullif(regexp_replace(coalesce(cm.phone,''), '\D', '', 'g'), ''), 'unknown') || '@no-email.invalid';
    end if;

    select id into v_contact from public.contacts where email = v_email;
    if v_contact is null then
      insert into public.contacts (email, full_name, notes)
      values (v_email, coalesce(nullif(trim(cm.name), ''), v_email), 'Created from the website contact form.')
      returning id into v_contact;
    end if;

    insert into public.support_threads (contact_id, subject, channel, status, last_message_at, created_at, updated_at)
    values (v_contact, coalesce(nullif(trim(cm.subject), ''), 'General Inquiry'), 'email', 'open', cm.created_at, cm.created_at, cm.created_at)
    returning id into v_thread;

    insert into public.support_messages (thread_id, direction, author_type, from_address, to_address, body_text, provider_message_id, created_at)
    values (v_thread, 'inbound', 'customer', v_email, 'info@evercoolthailand.com',
            cm.message || E'\n\nPhone: ' || coalesce(cm.phone, ''),
            'webform:' || cm.id, cm.created_at);
  end loop;
end $mig$;
