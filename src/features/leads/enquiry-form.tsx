'use client';
import { useRef, useState } from 'react';
import { MobileInput } from '@/features/contacts/mobile-input';
import { indianMobileSchema } from '@/contracts/phone';
import { indiaToday,measurementRequestSchema } from '@/contracts/measurement-request';
import type { ProductVariant, ProductOption } from '@/contracts/catalog';
import { Button } from '@/components/ui/button';
import { referenceUpload } from '@/features/media/reference-upload';
import { useLocale } from '@/lib/i18n/locale-context';

export function EnquiryForm({
  product,
  initialRequirement,
  initialMeasurement=false,
  variants = [],
  options = []
}: {
  product?: string;
  initialRequirement?: string;
  initialMeasurement?: boolean;
  variants?: ProductVariant[];
  options?: ProductOption[];
}) {
  const { locale } = useLocale();
  const [measurement,setMeasurement]=useState(initialMeasurement);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [referenceRetry, setReferenceRetry] = useState(false);
  const reference = useRef<ReturnType<typeof referenceUpload> | null>(null);
  const submitting = useRef(false);

  async function attachReference() {
    if (submitting.current || !reference.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await reference.current();
      reference.current = null;
    } catch (e) {
      setError(
        `Your enquiry is saved. Reference image could not be attached: ${e instanceof Error ? e.message : 'please contact the workshop'}`
      );
    } finally {
      submitting.current = false;
      setReferenceRetry(Boolean(reference.current));
      setBusy(false);
    }
  }

  async function submit(form: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      const file = form.get('design');
      if (
        file instanceof File &&
        file.size &&
        (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)
      ) {
        throw new Error(
          locale === 'hi'
            ? 'कृपया 10 MB तक की JPG, PNG या WebP फोटो चुनें।'
            : 'Choose a JPG, PNG or WebP design up to 10 MB.'
        );
      }
      const payload = {
        ...(measurement?{measurement_request:measurementRequestSchema.parse({preferred_date:form.get('preferred_date'),time_window:form.get('time_window'),address:form.get('site_address'),postal_code:form.get('postal_code')})}:{}),
        name: String(form.get('name')).trim(),
        phone: indianMobileSchema.parse(String(form.get('phone'))),
        email: form.get('email') || null,
        city: form.get('city'),
        requirement: form.get('requirement'),
        product_id: product ?? null,
        source: 'direct',
        website: form.get('website'),
        selected_variant_id: form.get('selected_variant_id') || null,
        selected_option_ids: form.getAll('selected_option_ids')
      };
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'Unable to send enquiry');
      setDone(true);
      if (file instanceof File && file.size) {
        try {
          if (!result.data.uploadToken) throw new Error('Image uploads are not configured yet');
          reference.current = referenceUpload(file, result.data.uploadToken);
          await reference.current();
          reference.current = null;
        } catch (e) {
          setError(
            `Your enquiry is saved. Reference image could not be attached: ${e instanceof Error ? e.message : 'please contact the workshop'}`
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to connect. Please try again.');
    } finally {
      submitting.current = false;
      setReferenceRetry(Boolean(reference.current));
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8" role="status">
        <h2 className="text-xl font-bold text-emerald-800" aria-label="Your enquiry has been received.">
          {locale === 'hi' ? 'आपकी जानकारी हमें मिल गई है (Your enquiry has been received)' : 'Your enquiry has been received.'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-emerald-700">
          {locale === 'hi'
            ? 'हमारी टीम जल्द ही आपसे फोन या WhatsApp पर संपर्क करेगी और नाप व कोटेशन की जानकारी देगी।'
            : 'Our team will review your requirement and follow up about measurement and a quotation.'}
        </p>
        {busy && (
          <p className="mt-3 text-xs text-emerald-700">
            {locale === 'hi' ? 'आपकी फोटो जोड़ी जा रही है…' : 'Attaching your reference image…'}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-orange-800">
            {error}
          </p>
        )}
        {error && referenceRetry && (
          <Button disabled={busy} className="mt-4" aria-label="Retry reference image" onClick={() => void attachReference()}>
            {locale === 'hi' ? 'फोटो दोबारा भेजें (Retry reference image)' : 'Retry reference image'}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={busy}
          className="mt-6"
          onClick={() => {
            reference.current = null;
            setReferenceRetry(false);
            setDone(false);
            setError('');
          }}
        >
          {locale === 'hi' ? 'एक और पूछताछ भेजें (Send another enquiry)' : 'Send another enquiry'}
        </Button>
      </div>
    );
  }

  return (
    <form
      method="post"
      action="#"
      onSubmit={event => {
        event.preventDefault();
        if (!busy) void submit(new FormData(event.currentTarget));
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800">
          {locale === 'hi' ? 'आपका नाम' : 'Your name'}
          <input
            className="mt-2"
            name="name"
            aria-label="Your name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder={locale === 'hi' ? 'उदा. अमित कुमार' : 'e.g. John Doe'}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          {locale === 'hi' ? 'मोबाइल / WhatsApp नंबर' : 'Mobile / WhatsApp'}
          <div className="mt-2"><MobileInput name="phone" ariaLabel="Mobile / WhatsApp" required/></div>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          {locale === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (optional)'}
          <input
            className="mt-2"
            name="email"
            aria-label="Email (optional)"
            type="email"
            autoComplete="email"
            placeholder="example@mail.com"
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          {locale === 'hi' ? 'गाँव / शहर / इलाका' : 'City / area'}
          <input
            className="mt-2"
            name="city"
            aria-label="City / area"
            required
            minLength={2}
            maxLength={100}
            autoComplete="address-level2"
            placeholder={locale === 'hi' ? 'उदा. रामपुर, सोनीपत' : 'e.g. Delhi, Jaipur'}
          />
        </label>
      </div>

      {variants.length > 0 && (
        <label className="block text-sm font-semibold text-slate-800">
          {locale === 'hi' ? 'पसंदीदा वेरिएंट (वैकल्पिक)' : 'Preferred variant (optional)'}
          <select className="mt-2" name="selected_variant_id" aria-label="Preferred variant">
            <option value="">{locale === 'hi' ? 'वर्कशॉप कारीगर से चर्चा करें' : 'Discuss with the workshop'}</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.colour ? ` · ${v.colour}` : ''}
                {v.finish ? ` · ${v.finish}` : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {options.length > 0 && (
        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold">
            {locale === 'hi' ? 'पसंदीदा विकल्प (वैकल्पिक)' : 'Preferred options (optional)'}
          </legend>
          {options.map(o => (
            <label key={o.id} className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="selected_option_ids" value={o.id} className="h-4 w-4 accent-orange-600" />
              {o.option_group}: {o.name}
            </label>
          ))}
          <p className="text-xs text-slate-500">
            {locale === 'hi'
              ? 'अधिकतम 20 चुनें। यह केवल शुरुआती चयन है, पक्का रेट कोटेशन में तय होगा।'
              : 'Select up to 20. Choices are indicative; final scope and price require a quotation.'}
          </p>
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-bold">{locale==='hi'?'साइट माप का अनुरोध':'Site measurement request'}</legend>
        <label className="flex items-center gap-2"><input type="checkbox" checked={measurement} onChange={event=>setMeasurement(event.target.checked)} className="h-4 w-4"/>{locale==='hi'?'मैं साइट पर माप के लिए विज़िट चाहता हूँ':'I would like a site measurement visit'}</label>
        {measurement&&<div className="grid gap-3 sm:grid-cols-2">
          <label>Preferred date (India time)<input className="mt-1" type="date" name="preferred_date" min={indiaToday()} required/></label>
          <label>Preferred time<select className="mt-1" name="time_window" aria-label="Preferred time" defaultValue="any"><option value="any">Any time — please call</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
          <label className="sm:col-span-2">Site address<textarea className="mt-1" name="site_address" required minLength={10} maxLength={400} rows={2}/></label>
          <label>PIN code<input className="mt-1" name="postal_code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required/></label>
          <p className="text-xs text-slate-500 sm:col-span-2">{locale==='hi'?'यह पसंदीदा समय का अनुरोध है। उपलब्धता, क्षेत्र और विज़िट शुल्क की पुष्टि टीम करेगी।':'This is a preferred-time request. Our team must confirm availability, coverage and any visit charge.'}</p>
        </div>}
      </fieldset>
      <label className="block text-sm font-semibold text-slate-800">
        {locale === 'hi' ? 'काम का विवरण (Tell us about your requirement)' : 'Tell us about your requirement'}
        <textarea
          className="mt-2"
          name="requirement"
          aria-label="Tell us about your requirement"
          defaultValue={initialRequirement}
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          placeholder={
            locale === 'hi'
              ? 'आपको क्या बनवाना है? गेट, रेलिंग, जाली की लंबाई, चौड़ाई और मटीरियल की जानकारी लिखें...'
              : 'What would you like fabricated? Include approximate dimensions, material and installation requirements.'
          }
        />
      </label>

      <label className="block text-sm font-semibold text-slate-800">
        {locale === 'hi' ? 'डिज़ाइन या फोटो (Reference design - optional)' : 'Reference design (optional)'}
        <input
          name="design"
          aria-label="Reference design (optional)"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2"
        />
        <span className="mt-2 block text-xs font-normal text-slate-400">
          {locale === 'hi'
            ? 'JPG, PNG या WebP फोटो (अधिकतम 10 MB)। यह केवल हमारे कारीगर देख सकेंगे।'
            : 'JPG, PNG or WebP, up to 10 MB. Shared privately with authorized workshop staff.'}
        </span>
      </label>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        {locale === 'hi'
          ? 'हम इन जानकारियों का उपयोग सिर्फ आपको कोटेशन और जानकारी देने के लिए करेंगे। किसी अकाउंट की आवश्यकता नहीं है।'
          : 'We use these details to respond to your enquiry. No customer account is required. Please avoid including sensitive information.'}
      </p>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button disabled={busy} size="lg" aria-label="Send enquiry" className="w-full sm:w-auto">
        {busy
          ? (locale === 'hi' ? 'भेज रहे हैं…' : 'Sending…')
          : (locale === 'hi' ? 'जानकारी भेजें (Send enquiry)' : 'Send enquiry')}
      </Button>
    </form>
  );
}



