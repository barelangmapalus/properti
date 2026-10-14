import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HOLD_MINUTES = 15;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getNightCount(checkIn: string, checkOut: string) {
  return (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`))
    / 86400000;
}

function getTodayInJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Login diperlukan.' }, 401);

  const supabaseUrl = Deno.env.get('BMPRO_SUPABASE_URL') || Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('BMPRO_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('BMPRO_SUPABASE_SERVICE_ROLE_KEY')
    || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Konfigurasi Supabase Edge Function belum lengkap.' }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: userError } = await authClient.auth.getUser();
  const user = userResult.user;
  if (userError || !user) return jsonResponse({ error: 'Sesi login tidak valid. Silakan login kembali.' }, 401);

  let body: {
    action?: string;
    property_external_id?: string;
    check_in?: string;
    check_out?: string;
    month?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request booking tidak valid.' }, 400);
  }

  if (!['calendar_availability', 'check_availability', 'create_booking'].includes(body.action || '')) {
    return jsonResponse({ error: 'Aksi booking tidak dikenal.' }, 400);
  }

  if (body.action === 'create_booking'
      && Deno.env.get('BMPRO_ALLOW_BOOKING_CREATION') !== 'true') {
    return jsonResponse({ error: 'Pembuatan booking dinonaktifkan pada environment ini.' }, 403);
  }

  if (!body.property_external_id) {
    return jsonResponse({ error: 'Properti booking wajib dipilih.' }, 400);
  }

  if (body.action === 'calendar_availability'
      && (typeof body.month !== 'string' || !/^\d{4}-\d{2}$/.test(body.month)
        || !isValidDate(`${body.month}-01`))) {
    return jsonResponse({ error: 'Bulan kalender tidak valid.' }, 400);
  }
  if (body.action === 'calendar_availability'
      && body.check_in !== undefined && !isValidDate(body.check_in)) {
    return jsonResponse({ error: 'Tanggal check-in kalender tidak valid.' }, 400);
  }

  if (body.action !== 'calendar_availability'
      && (!isValidDate(body.check_in) || !isValidDate(body.check_out))) {
    return jsonResponse({ error: 'Properti dan tanggal booking wajib diisi dengan benar.' }, 400);
  }

  if (body.action !== 'calendar_availability' && body.check_out! <= body.check_in!) {
    return jsonResponse({ error: 'Tanggal check-out harus setelah check-in.' }, 400);
  }
  if (body.action !== 'calendar_availability' && body.check_in! < getTodayInJakarta()) {
    return jsonResponse({ error: 'Tanggal check-in tidak boleh sebelum hari ini.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: expiryError } = await adminClient
    .from('bookings')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .not('expires_at', 'is', null)
    .lte('expires_at', new Date().toISOString());
  if (expiryError) {
    console.error('Could not expire timed-out bookings:', expiryError);
    return jsonResponse({ error: 'Gagal memperbarui booking kedaluwarsa.' }, 500);
  }

  const { data: property, error: propertyError } = await adminClient
    .from('properties')
    .select('id, external_id, name, price_per_night, status')
    .eq('external_id', body.property_external_id)
    .eq('status', 'available')
    .maybeSingle();

  if (propertyError) {
    console.error('Property lookup failed:', propertyError);
    return jsonResponse({ error: 'Gagal memuat properti dari database.' }, 500);
  }
  if (!property) return jsonResponse({ error: 'Properti tidak ditemukan atau tidak tersedia.' }, 404);

  if (body.action === 'calendar_availability') {
    const monthStart = `${body.month}-01`;
    const [year, month] = body.month!.split('-').map(Number);
    if (year === 9999 && month === 12) {
      return jsonResponse({ error: 'Bulan kalender berada di luar rentang yang didukung.' }, 400);
    }
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const monthEnd = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;
    if (body.check_in && body.check_in >= monthEnd) {
      return jsonResponse({ error: 'Bulan kalender harus mencakup tanggal check-in.' }, 400);
    }
    const availabilityStart = body.check_in || monthStart;
    const { data: bookings, error: calendarError } = await adminClient
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', property.id)
      .in('status', ['pending', 'paid'])
      .lt('check_in', monthEnd)
      .gt('check_out', availabilityStart);

    if (calendarError) {
      console.error('Calendar availability lookup failed:', calendarError);
      return jsonResponse({ error: 'Gagal memuat ketersediaan kalender.' }, 500);
    }

    return jsonResponse({
      month: body.month,
      bookings: bookings || [],
      price_per_night: Number(property.price_per_night),
    });
  }

  const nightCount = getNightCount(body.check_in!, body.check_out!);
  if (!Number.isSafeInteger(nightCount) || nightCount < 1) {
    return jsonResponse({ error: 'Durasi booking tidak valid.' }, 400);
  }

  const pricePerNight = Number(property.price_per_night);
  const totalAmount = pricePerNight * nightCount;
  if (!Number.isSafeInteger(pricePerNight) || pricePerNight <= 0
      || !Number.isSafeInteger(totalAmount) || totalAmount <= 0) {
    return jsonResponse({ error: 'Harga properti belum valid di Supabase.' }, 409);
  }

  const { data: conflicts, error: conflictError } = await adminClient
    .from('bookings')
    .select('id')
    .eq('property_id', property.id)
    .in('status', ['pending', 'paid'])
    .lt('check_in', body.check_out!)
    .gt('check_out', body.check_in!)
    .limit(1);

  if (conflictError) {
    console.error('Availability lookup failed:', conflictError);
    return jsonResponse({ error: 'Gagal memeriksa ketersediaan tanggal.' }, 500);
  }

  if (conflicts?.length) {
    if (body.action === 'check_availability') {
      return jsonResponse({ available: false, error: 'Tanggal tersebut sudah dipesan.' });
    }
    return jsonResponse({ available: false, error: 'Tanggal tersebut sudah dipesan.' }, 409);
  }

  if (body.action === 'check_availability') {
    return jsonResponse({
      available: true,
      property: { name: property.name, price_per_night: pricePerNight },
      price_per_night: pricePerNight,
      nights: nightCount,
      total_amount: totalAmount,
    });
  }

  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .insert({
      property_id: property.id,
      renter_id: user.id,
      check_in: body.check_in!,
      check_out: body.check_out!,
      total_amount: totalAmount,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id, property_id, check_in, check_out, total_amount, status, expires_at')
    .single();

  if (bookingError) {
    if (bookingError.code === '23P01') {
      return jsonResponse({ error: 'Tanggal baru saja dipesan pengguna lain. Pilih tanggal lain.' }, 409);
    }
    console.error('Booking insert failed:', bookingError);
    return jsonResponse({ error: 'Booking gagal disimpan.' }, 500);
  }

  return jsonResponse({
    booking,
    nights: nightCount,
    price_per_night: pricePerNight,
    payment_status: 'not_configured',
  }, 201);
});
