import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { IMAGES } from '../data/seedData';
import { useBakery } from '../context/BakeryContext';
import type { TableReservation } from '../types/bakery';
import { SafeImage } from '../components/BrandPrimitives';

const ENQUIRY_TYPES = [
  'General enquiries',
  'Custom cake orders',
  'Wedding cakes',
  'Birthday celebrations',
  'Corporate dessert orders',
  'Cafe events',
  'Bulk bakery orders',
];

const SEATING_ZONES = [
  {
    name: 'Sunlit Window Lounge',
    capacity: '2–6 Guests',
    ambience: 'Natural daylight · Marble bistro tables overlooking the boulevard',
    includes: 'Plush dusty-rose velvet banquettes & brass lamps',
  },
  {
    name: 'Espresso Bar Alcove',
    capacity: '1–4 Guests',
    ambience: 'Aromatic & intimate · Beside the walnut single-origin espresso counter',
    includes: 'Front-row espresso craft view & power outlets',
  },
  {
    name: 'Garden Terrace',
    capacity: '2–6 Guests',
    ambience: 'Breezy open-air patio · Framed by olive trees and warm lanterns',
    includes: 'Ideal for golden-hour coffee & chilled milkshakes',
  },
  {
    name: 'Private Celebration Corner',
    capacity: '4–12 Guests',
    ambience: 'Semi-private lounge alcove · Curated for birthdays & anniversaries',
    includes: 'Complimentary cake plating & dedicated server attention',
  },
];

const TABLE_PACKAGES = [
  {
    id: 'Standard Table Seating',
    desc: 'Full-menu dining from our coffee, pastry & cake counter',
  },
  {
    id: 'Coffee & Croissant Pairing',
    desc: 'Pre-noted morning pastries & specialty Arabica coffee table setup',
  },
  {
    id: 'Celebration Dessert Table',
    desc: 'Prepared for cake cutting, candles & plated bakery desserts',
  },
];

export function CafeContactPage() {
  const { cms, user, token, notify, setConciergeOpen } = useBakery();

  const [resForm, setResForm] = useState({
    customerName: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    date: '2026-11-22',
    time: '5:00 PM',
    guests: 2,
    seatingPreference: SEATING_ZONES[0].name,
    tablePackage: TABLE_PACKAGES[0].id,
    specialRequests: '',
  });
  const [resSubmitting, setResSubmitting] = useState(false);
  const [confirmedRes, setConfirmedRes] = useState<TableReservation | null>(null);

  // Reservation lookup ("Know what you reserved")
  const [lookupId, setLookupId] = useState('TR-501');
  const [lookedUpRes, setLookedUpRes] = useState<TableReservation | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [enqForm, setEnqForm] = useState({
    type: ENQUIRY_TYPES[0],
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    message: '',
  });
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSent, setEnqSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    setResForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name || '',
      mobile: prev.mobile || user.mobile || '',
      email: prev.email || user.email || '',
    }));
    setEnqForm((prev) => ({
      ...prev,
      name: prev.name || user.name || '',
      mobile: prev.mobile || user.mobile || '',
      email: prev.email || user.email || '',
    }));
  }, [user]);

  const fetchReservationDetails = async (targetId?: string) => {
    const id = (targetId ?? lookupId).trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const res = await fetch(`/api/reservations/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reservation not found');
      setLookedUpRes(data.reservation);
      setLookupId(data.reservation.id);
    } catch (err) {
      setLookedUpRes(null);
      setLookupError(err instanceof Error ? err.message : 'Reservation not found');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetchReservationDetails('TR-501');
  }, []);

  const selectedZone =
    SEATING_ZONES.find((z) => z.name === resForm.seatingPreference) || SEATING_ZONES[0];

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setResSubmitting(true);
    try {
      const combinedNotes = [
        resForm.tablePackage !== TABLE_PACKAGES[0].id ? `Experience: ${resForm.tablePackage}` : '',
        resForm.specialRequests.trim(),
      ]
        .filter(Boolean)
        .join(' · ');

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: resForm.customerName,
          mobile: resForm.mobile,
          email: resForm.email,
          date: resForm.date,
          time: resForm.time,
          guests: resForm.guests,
          seatingPreference: resForm.seatingPreference,
          specialRequests: combinedNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit reservation');
      setConfirmedRes(data.reservation);
      setLookedUpRes(data.reservation);
      setLookupId(data.reservation.id);
      notify('Table Request Recorded', `Reference ${data.reservation.id} saved in demo mode.`);
    } catch (err) {
      notify('Reservation Error', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setResSubmitting(false);
    }
  };

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqSubmitting(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enqForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send enquiry');
      setEnqSent(true);
      notify('Enquiry Received', `Reference ${data.enquiry.id} logged for our events team.`);
      setEnqForm({ ...enqForm, message: '' });
    } catch (err) {
      notify('Enquiry Error', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setEnqSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/60 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              Sector 62, Noida · Bakery &amp; Cafe Lounge
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#49372F] mb-3">
              Visit Our Cafe &amp; Contact
            </h1>
            <p className="text-base text-[#795B48] max-w-2xl">
              Preview our dining zones, reserve a sunlit marble table with full booking transparency,
              or speak directly with Eclair AI, our personal cafe assistant.
            </p>
          </div>
          {!user ? (
            <Link
              to="/account"
              className="h-10 px-4 rounded-lg border border-[#D9C2A5] bg-[#F8F3EB] text-xs font-semibold text-[#49372F] inline-flex items-center gap-2 hover:border-[#C6A477] shrink-0"
            >
              <User className="w-4 h-4 text-[#C6A477]" />
              Sign In to Save Reservations
            </Link>
          ) : (
            <Link
              to="/account"
              className="h-10 px-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-medium text-[#49372F] inline-flex items-center gap-2 shrink-0"
            >
              <User className="w-4 h-4 text-[#C6A477]" />
              Signed in as {user.name.split(' ')[0]}
            </Link>
          )}
        </div>
      </section>

      {/* Section A: Visit Our Cafe */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#D9C2A5]/60 aspect-[4/3] sm:aspect-auto">
              <SafeImage
                src={IMAGES.cafeExterior}
                alt="Maison Éclat cafe exterior storefront"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#D9C2A5]/60 aspect-[4/3] sm:aspect-auto">
              <SafeImage
                src={IMAGES.heroCafe}
                alt="Maison Éclat cafe interior lounge"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#795B48]">
                Demonstration Flagship Location
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#49372F]">
                Maison Éclat Noida
              </h2>
              <div className="space-y-3 text-sm text-[#795B48]">
                <p className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C6A477] shrink-0 mt-1" />
                  <span>{cms.address} (Fictional Demonstration Location)</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#C6A477] shrink-0" />
                  <span>{cms.openingHours}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#C6A477] shrink-0" />
                  <span>{cms.phoneDemo}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#C6A477] shrink-0" />
                  <span>{cms.emailDemo}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-[#D9C2A5] h-44 bg-[#F8F3EB]">
                <iframe
                  title="Sector 62 Noida Location Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.3520%2C28.6180%2C77.3780%2C28.6370&layer=mapnik&marker=28.6279%2C77.3649"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Sector+62+Noida+Uttar+Pradesh+India"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#795B48] transition-colors"
              >
                Get Directions
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section B & C: Table Reservations + Contact & Events */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Table Reservations */}
          <div className="lg:col-span-6 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                Table Reservations
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-2">
                Reserve Your Cafe Table
              </h2>
              <p className="text-sm text-[#795B48]">
                Select your seating zone and table setup below to preview exactly what you are
                reserving.
              </p>
            </div>

            {confirmedRes ? (
              <div className="p-6 rounded-xl bg-[#F8F3EB] border border-[#C6A477] space-y-4">
                <div className="flex items-center gap-2 text-[#49372F]">
                  <CheckCircle2 className="w-5 h-5 text-[#A8B39C]" />
                  <h3 className="font-serif text-2xl font-semibold">
                    Table Request Recorded ({confirmedRes.id})
                  </h3>
                </div>

                {/* Full Reserved Details */}
                <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/60 p-4 space-y-2 text-xs text-[#49372F]">
                  <p className="uppercase tracking-wider text-[10px] font-semibold text-[#795B48]">
                    What You Reserved
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#795B48]">Seating Zone:</span>{' '}
                      <strong>{confirmedRes.seatingPreference}</strong>
                    </div>
                    <div>
                      <span className="text-[#795B48]">Party Size:</span>{' '}
                      <strong>{confirmedRes.guests} Guests</strong>
                    </div>
                    <div>
                      <span className="text-[#795B48]">Date:</span>{' '}
                      <strong>{confirmedRes.date}</strong>
                    </div>
                    <div>
                      <span className="text-[#795B48]">Time:</span>{' '}
                      <strong>{confirmedRes.time}</strong>
                    </div>
                  </div>
                  {confirmedRes.specialRequests && (
                    <p className="pt-1 border-t border-[#D9C2A5]/40 text-[#795B48]">
                      Setup &amp; Notes: <span className="text-[#49372F]">{confirmedRes.specialRequests}</span>
                    </p>
                  )}
                  <p className="text-[#795B48]">
                    Current Status: <strong className="text-[#49372F]">{confirmedRes.status}</strong>
                  </p>
                </div>

                <p className="text-xs text-[#795B48]">
                  Demonstration Mode: You can revisit or check this reservation anytime below using{' '}
                  <span className="font-mono font-semibold text-[#49372F]">{confirmedRes.id}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmedRes(null)}
                  className="px-4 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleReserve} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Guest Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={resForm.customerName}
                      onChange={(e) => setResForm({ ...resForm, customerName: e.target.value })}
                      placeholder="Full name"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={resForm.mobile}
                      onChange={(e) => setResForm({ ...resForm, mobile: e.target.value })}
                      placeholder="+91 98..."
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={resForm.email}
                    onChange={(e) => setResForm({ ...resForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Date *
                    </label>
                    <input
                      required
                      type="date"
                      value={resForm.date}
                      onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Time *
                    </label>
                    <select
                      value={resForm.time}
                      onChange={(e) => setResForm({ ...resForm, time: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    >
                      <option>10:30 AM</option>
                      <option>1:00 PM</option>
                      <option>4:30 PM</option>
                      <option>5:00 PM</option>
                      <option>7:00 PM</option>
                      <option>8:30 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Guests
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-[#795B48] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={1}
                        max={16}
                        value={resForm.guests}
                        onChange={(e) =>
                          setResForm({ ...resForm, guests: Number(e.target.value) || 2 })
                        }
                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                {/* Seating Zone Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-2">
                    Choose Your Seating Zone
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SEATING_ZONES.map((zone) => {
                      const active = resForm.seatingPreference === zone.name;
                      return (
                        <button
                          key={zone.name}
                          type="button"
                          onClick={() => setResForm({ ...resForm, seatingPreference: zone.name })}
                          className={`p-3 rounded-xl border text-left transition-colors ${
                            active
                              ? 'bg-[#F8F3EB] border-[#49372F]'
                              : 'bg-[#FFFFFF] border-[#D9C2A5]/70 hover:border-[#C6A477]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#49372F]">
                              {zone.name}
                            </span>
                            <span className="text-[10px] font-medium text-[#795B48]">
                              {zone.capacity}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#795B48] mt-1 leading-snug">
                            {zone.ambience}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience / Table Package */}
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Table Experience Setup
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {TABLE_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setResForm({ ...resForm, tablePackage: pkg.id })}
                        className={`p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 ${
                          resForm.tablePackage === pkg.id
                            ? 'bg-[#F8F3EB] border-[#49372F]'
                            : 'bg-[#FFFFFF] border-[#D9C2A5]/60'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#49372F]">{pkg.id}</p>
                          <p className="text-[11px] text-[#795B48]">{pkg.desc}</p>
                        </div>
                        <Sparkles
                          className={`w-3.5 h-3.5 shrink-0 ${
                            resForm.tablePackage === pkg.id ? 'text-[#C6A477]' : 'text-[#D9C2A5]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Special Requests
                  </label>
                  <textarea
                    rows={2}
                    value={resForm.specialRequests}
                    onChange={(e) => setResForm({ ...resForm, specialRequests: e.target.value })}
                    placeholder="Anniversary candle, high chair, or quiet table..."
                    className="w-full p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>

                {/* Live What You Are Reserving Summary */}
                <div className="p-4 rounded-xl bg-[#F8F3EB] border border-[#C6A477]/70 space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#795B48]">
                    Summary · What You Are Reserving
                  </p>
                  <p className="font-serif text-lg font-semibold text-[#49372F]">
                    {selectedZone.name} ({selectedZone.capacity})
                  </p>
                  <p className="text-xs text-[#795B48]">
                    {resForm.date} at {resForm.time} · {resForm.guests}{' '}
                    {resForm.guests === 1 ? 'Guest' : 'Guests'} · {resForm.tablePackage}
                  </p>
                  <p className="text-[11px] text-[#795B48]">
                    Includes: {selectedZone.includes}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resSubmitting}
                  className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#795B48]"
                >
                  <Calendar className="w-4 h-4 text-[#C6A477]" />
                  {resSubmitting ? 'Requesting Table...' : 'Book a Table'}
                </button>
              </form>
            )}
          </div>

          {/* Contact & Events */}
          <div className="lg:col-span-6 space-y-8">
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                Contact &amp; Celebrations
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-2">
                Events, Weddings &amp; Corporate Gifting
              </h2>
              <p className="text-sm text-[#795B48] mb-5">
                Select an enquiry category below and our hospitality team will follow up.
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {ENQUIRY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEnqForm({ ...enqForm, type })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      enqForm.type === type
                        ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
                        : 'bg-[#F8F3EB] text-[#795B48] border-[#D9C2A5]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {enqSent && (
                <div className="mb-4 p-4 rounded-xl bg-[#F8F3EB] border border-[#C6A477] text-xs text-[#49372F]">
                  Thank you! Your {enqForm.type.toLowerCase()} note has been saved for our team.
                </div>
              )}

              <form onSubmit={handleEnquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Your Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={enqForm.name}
                      onChange={(e) => setEnqForm({ ...enqForm, name: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={enqForm.mobile}
                      onChange={(e) => setEnqForm({ ...enqForm, mobile: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={enqForm.email}
                    onChange={(e) => setEnqForm({ ...enqForm, email: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Enquiry Details ({enqForm.type}) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={enqForm.message}
                    onChange={(e) => setEnqForm({ ...enqForm, message: e.target.value })}
                    placeholder="Tell us about your celebration, guest count, preferred flavours, or corporate hamper requirements..."
                    className="w-full p-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enqSubmitting}
                  className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48]"
                >
                  {enqSubmitting ? 'Sending Enquiry...' : 'Send Enquiry'}
                </button>
              </form>
            </div>

            {/* Check What You Reserved — Reservation Lookup Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-1">
                  Reservation Lookup
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Check What You Reserved
                </h3>
                <p className="text-xs text-[#795B48] mt-1">
                  Enter your Table Reservation ID to review your reserved seating zone, timing, and
                  booking status.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchReservationDetails();
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#795B48] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="e.g. TR-501"
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="h-10 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium hover:bg-[#795B48]"
                >
                  {lookupLoading ? 'Checking...' : 'Check'}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#795B48]">Demo IDs:</span>
                {['TR-501', 'TR-502'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => fetchReservationDetails(id)}
                    className="px-2.5 py-1 rounded-md bg-[#F8F3EB] border border-[#D9C2A5] font-mono text-[#49372F] hover:border-[#C6A477]"
                  >
                    {id}
                  </button>
                ))}
              </div>

              {lookupError && (
                <p className="text-xs text-[#795B48] bg-[#F8F3EB] p-3 rounded-lg">{lookupError}</p>
              )}

              {lookedUpRes && (
                <div className="p-4 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[#49372F]">
                      {lookedUpRes.id} · {lookedUpRes.customerName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FFFFFF] border border-[#C6A477] font-semibold text-[#49372F]">
                      {lookedUpRes.status}
                    </span>
                  </div>
                  <p className="font-serif text-base font-semibold text-[#49372F]">
                    {lookedUpRes.seatingPreference}
                  </p>
                  <p className="text-[#795B48]">
                    {lookedUpRes.date} at {lookedUpRes.time} · {lookedUpRes.guests} Guests
                  </p>
                  {lookedUpRes.specialRequests && (
                    <p className="text-[#795B48]">
                      Notes: <span className="text-[#49372F]">{lookedUpRes.specialRequests}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Eclair AI Assistant Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#49372F] text-[#F8F3EB] rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C6A477] mb-2">
              Personal Bakery Assistant
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#FFFFFF] mb-2">
              Meet Eclair AI — Your Personal Bakery &amp; Cafe Assistant
            </h2>
            <p className="text-sm sm:text-base text-[#D9C2A5] leading-relaxed">
              Ask Eclair AI about coffee pours, cake pricing in INR, eggless options, reservation
              lookup (like TR-501), custom cake estimates, or live order tracking anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConciergeOpen(true)}
            className="h-12 px-6 rounded-lg bg-[#C6A477] text-[#49372F] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#D9C2A5] transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Ask Eclair AI
          </button>
        </div>
      </section>
    </div>
  );
}
